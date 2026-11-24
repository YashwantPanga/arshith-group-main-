import cluster from 'node:cluster';
import os from 'node:os';
import { config } from './config.js';
/* One Node process uses one CPU core. For big exams (thousands of students at once) the server runs
 * several worker processes that share port 4000; the database keeps all state, so any worker can serve any student.
 * WORKERS=1 turns this off. Background jobs (auto-submit, reminders) run in exactly one worker. */
const WORKERS = Math.max(1, Number(process.env.WORKERS ?? Math.min(os.cpus().length, 6)));
if (cluster.isPrimary && WORKERS > 1) {
    const fork = (scheduler) => {
        const w = cluster.fork({ RUN_SCHEDULER: scheduler ? '1' : '0' });
        w.on('exit', (code, signal) => {
            if (shuttingDown)
                return;
            console.error(`worker ${w.process.pid} stopped (${signal ?? code}); starting a new one`);
            fork(scheduler);
        });
    };
    let shuttingDown = false;
    for (let i = 0; i < WORKERS; i++)
        fork(i === 0);
    console.log(`✔ ${config.ORG_NAME} API listening on http://localhost:${config.PORT} (${WORKERS} workers)`);
    const stop = () => { shuttingDown = true; for (const w of Object.values(cluster.workers ?? {}))
        w?.kill(); process.exit(0); };
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
}
else {
    const { createApp } = await import('./app.js');
    const { prisma } = await import('./db.js');
    const { startScheduler } = await import('./jobs/scheduler.js');
    const app = createApp();
    const server = app.listen(config.PORT, () => {
        if (WORKERS === 1)
            console.log(`✔ ${config.ORG_NAME} API listening on http://localhost:${config.PORT}`);
        if (WORKERS === 1 || process.env.RUN_SCHEDULER === '1')
            startScheduler();
    });
    server.keepAliveTimeout = 65000; // behind Cloudflare / proxies, keep connections reusable
    const shutdown = async () => {
        server.close();
        await prisma.$disconnect();
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
process.on('unhandledRejection', (e) => console.error('unhandledRejection', e));
