// Sandboxed Python runner. Executed as: node --permission --allow-fs-read=<pyodide dir> run.mjs  (empty env, no network/child-process/worker access)
// stdin: {"code","func","cases":[{"args":[],"expected":<json>|undefined,"hasExpected":bool}],"timeoutMs"}
// stdout: one JSON line per case: {"i","ok","actual","error","ms","memKb","out"}
import { readFileSync, constants as fsConstants } from 'node:fs';

// Emscripten's NODEFS init asks for process.binding('constants'), which the permission model blocks. Provide only the constants.
process.binding = (name) => { if (name === 'constants') return { fs: fsConstants, ...fsConstants }; throw new Error('blocked: ' + name); };

const { loadPyodide } = await import('pyodide');
const input = JSON.parse(readFileSync(0, 'utf8'));
const py = await loadPyodide({ stdout: () => {}, stderr: () => {} });

// Python itself can reach the host only through the `js` bridge: remove everything dangerous before user code runs.
for (const k of ['process', 'require', 'fetch', 'WebSocket', 'XMLHttpRequest', 'Worker', 'SharedArrayBuffer', 'Buffer']) { try { delete globalThis[k]; } catch { /* ignore */ } }

py.globals.set('_input', JSON.stringify(input));
const harness = `
import json, sys, io, time, copy, math, tracemalloc, builtins
_inp = json.loads(_input)
def _norm(x):
    if isinstance(x, tuple) or isinstance(x, list): return [_norm(i) for i in x]
    if isinstance(x, (set, frozenset)): return sorted([_norm(i) for i in x], key=lambda v: json.dumps(v, sort_keys=True))
    if isinstance(x, dict): return {str(k): _norm(v) for k, v in x.items()}
    return x
def _eq(a, b):
    if isinstance(a, float) or isinstance(b, float):
        try: return math.isclose(a, b, rel_tol=1e-6, abs_tol=1e-6)
        except Exception: return False
    if isinstance(a, list) and isinstance(b, list): return len(a) == len(b) and all(_eq(x, y) for x, y in zip(a, b))
    if isinstance(a, dict) and isinstance(b, dict): return a.keys() == b.keys() and all(_eq(a[k], b[k]) for k in a)
    return a == b and type(a) == type(b) if isinstance(a, bool) or isinstance(b, bool) else a == b
_ns = {'__name__': '__main__'}
_err = None
try:
    exec(compile(_inp['code'], 'solution.py', 'exec'), _ns)
    _fn = _ns.get(_inp['func'])
    if not callable(_fn): raise NameError("function '%s' is not defined" % _inp['func'])
except BaseException as e:
    _err = type(e).__name__ + ': ' + str(e)
_results = []
for _i, _c in enumerate(_inp['cases']):
    _buf = io.StringIO(); _old = sys.stdout; sys.stdout = _buf
    _r = {'i': _i, 'ok': False, 'actual': None, 'error': _err, 'ms': 0, 'memKb': 0, 'out': ''}
    if _err is None:
        tracemalloc.start(); _t = time.perf_counter()
        try:
            _a = _norm(_fn(*copy.deepcopy(_c['args'])))
            json.dumps(_a)
            _r['actual'] = _a
            if _c.get('hasExpected'): _r['ok'] = _eq(_a, _c['expected'])
            else: _r['ok'] = True
        except BaseException as e:
            _r['error'] = type(e).__name__ + ': ' + str(e)[:300]
        _r['ms'] = round((time.perf_counter() - _t) * 1000, 2)
        _r['memKb'] = round(tracemalloc.get_traced_memory()[1] / 1024, 1); tracemalloc.stop()
    sys.stdout = _old
    _r['out'] = _buf.getvalue()[:500]
    _results.append(json.dumps(_r))
_results[0]
`;
// run one case at a time so a hang only loses the remaining cases; results are streamed as lines
const total = input.cases.length;
const single = (i) => ({ ...input, cases: [input.cases[i]] });
for (let i = 0; i < total; i++) {
  py.globals.set('_input', JSON.stringify(single(i)));
  const line = await py.runPythonAsync(harness);
  const r = JSON.parse(line); r.i = i;
  process_stdout(JSON.stringify(r));
}
function process_stdout(s) { console.log(s); }
