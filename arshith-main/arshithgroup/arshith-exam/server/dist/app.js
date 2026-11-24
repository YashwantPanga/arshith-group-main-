import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { prisma } from './db.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { authRouter } from './modules/auth.js';
import { studentsRouter, batchesRouter } from './modules/students.js';
import { questionsRouter } from './modules/questions.js';
import { assessmentsRouter } from './modules/assessments.js';
import { schedulesRouter } from './modules/schedules.js';
import { studentRouter, examRouter } from './modules/student.js';
import { resultsRouter, reportRouter } from './modules/results.js';
import { adminRouter } from './modules/admin.js';
import { publicRouter } from './modules/public.js';
export function createApp() {
    const app = express();
    app.set('trust proxy', 1);
    app.disable('x-powered-by');
    app.use(helmet({ contentSecurityPolicy: false }));
    app.use(cors({ origin: [...config.CLIENT_URL.split(',').map((s) => s.trim()), 'http://localhost', 'https://localhost', 'capacitor://localhost'], credentials: true, exposedHeaders: ['Content-Disposition'] }));
    app.use(compression());
    app.use(express.json({ limit: '1mb' }));
    app.get('/api/health', async (_req, res) => {
        await prisma.$queryRaw `SELECT 1`;
        res.json({ ok: true, time: new Date() });
    });
    app.use('/api/auth', authRouter);
    app.use('/api/public', publicRouter);
    app.use('/api/admin/students', studentsRouter);
    app.use('/api/admin/batches', batchesRouter);
    app.use('/api/admin/questions', questionsRouter);
    app.use('/api/admin/assessments', assessmentsRouter);
    app.use('/api/admin/schedules', schedulesRouter);
    app.use('/api/admin/results', resultsRouter);
    app.use('/api/admin/reports', reportRouter);
    app.use('/api/admin', adminRouter);
    app.use('/api/student', studentRouter);
    app.use('/api/exam', examRouter);
    app.use('/api', notFoundHandler);
    // Production: serve the built React app from the same origin (SPA fallback)
    const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../web/dist');
    if (fs.existsSync(dist)) {
        app.use('/assets', express.static(path.join(dist, 'assets'), { immutable: true, maxAge: '365d' }));
        app.use(express.static(dist, { maxAge: '1h', index: false }));
        app.get(/^(?!\/api).*/, (_req, res) => res.set('Cache-Control', 'no-cache').sendFile(path.join(dist, 'index.html')));
    }
    app.use(errorHandler);
    return app;
}
