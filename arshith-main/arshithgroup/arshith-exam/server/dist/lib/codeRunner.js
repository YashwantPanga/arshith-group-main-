import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HttpError } from './errors.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const runnerDir = path.join(root, 'runner');
const pyodideDir = path.join(root, 'node_modules', 'pyodide');
const PERMISSION_FLAG = Number(process.versions.node.split('.')[0]) >= 24 ? '--permission' : '--experimental-permission';
const MAX_PARALLEL = Number(process.env.CODE_RUNNER_CONCURRENCY ?? 3);
let running = 0;
const waiters = [];
async function acquire() {
    if (running < MAX_PARALLEL) {
        running++;
        return;
    }
    await new Promise((resolve, reject) => {
        const t = setTimeout(() => { const i = waiters.indexOf(go); if (i >= 0)
            waiters.splice(i, 1); reject(new HttpError(503, 'The code runner is busy. Please try again in a few seconds.', 'RUNNER_BUSY')); }, 30000);
        const go = () => { clearTimeout(t); running++; resolve(); };
        waiters.push(go);
    });
}
const release = () => { running--; waiters.shift()?.(); };
/**
 * Executes Python (Pyodide / Python 3.12, WebAssembly) in a locked-down Node process:
 * Node permission model (no child processes, workers, addons; read access only to the runtime files),
 * empty environment, network globals removed, hard wall-clock limit. One process per run.
 */
export async function runPython(code, func, cases) {
    await acquire();
    try {
        const budget = Math.min(30000, 7000 + cases.length * 2000);
        const child = spawn(process.execPath, [PERMISSION_FLAG, `--allow-fs-read=${pyodideDir}`, `--allow-fs-read=${runnerDir}`, '--max-old-space-size=384', path.join(runnerDir, 'run.mjs')], { env: {}, stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true });
        const results = new Map();
        let buf = '';
        let bytes = 0;
        child.stdout.on('data', (d) => {
            bytes += d.length;
            if (bytes > 2_000_000) {
                child.kill('SIGKILL');
                return;
            }
            buf += d.toString('utf8');
            let nl;
            while ((nl = buf.indexOf('\n')) >= 0) {
                const line = buf.slice(0, nl).trim();
                buf = buf.slice(nl + 1);
                if (line.startsWith('{')) {
                    try {
                        const r = JSON.parse(line);
                        results.set(r.i, r);
                    }
                    catch { /* ignore noise */ }
                }
            }
        });
        const done = new Promise((resolve) => { child.on('close', () => resolve()); child.on('error', () => resolve()); });
        const killer = setTimeout(() => child.kill('SIGKILL'), budget);
        child.stdin.on('error', () => { });
        child.stdin.end(JSON.stringify({ code, func, cases }));
        await done;
        clearTimeout(killer);
        return cases.map((_, i) => results.get(i) ?? { i, ok: false, actual: null, error: results.size === 0 && i === 0 ? 'Time limit exceeded (or the program crashed)' : 'Time limit exceeded', ms: 0, memKb: 0, out: '' });
    }
    finally {
        release();
    }
}
