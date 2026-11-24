import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { HttpError } from '../lib/errors.js';
import { isProd } from '../config.js';
export const notFoundHandler = (req, res) => {
    res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.path}`, code: 'NOT_FOUND' } });
};
export const errorHandler = (err, _req, res, _next) => {
    if (err instanceof HttpError) {
        res.status(err.status).json({ error: { message: err.message, code: err.code, details: err.details } });
        return;
    }
    if (err instanceof ZodError) {
        const fields = {};
        for (const i of err.issues)
            fields[i.path.join('.') || '_'] ??= i.message;
        res.status(422).json({ error: { message: Object.values(fields)[0] ?? 'Validation failed', code: 'VALIDATION', details: fields } });
        return;
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            const target = err.meta?.target?.join(', ') ?? 'value';
            res.status(409).json({ error: { message: `A record with this ${target} already exists`, code: 'DUPLICATE' } });
            return;
        }
        if (err.code === 'P2025') {
            res.status(404).json({ error: { message: 'Record not found', code: 'NOT_FOUND' } });
            return;
        }
        if (err.code === 'P2003') {
            res.status(409).json({ error: { message: 'This record is referenced by other data and cannot be changed', code: 'IN_USE' } });
            return;
        }
    }
    if (err?.type === 'entity.parse.failed') {
        res.status(400).json({ error: { message: 'Malformed JSON body', code: 'BAD_JSON' } });
        return;
    }
    if (err?.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ error: { message: 'File is too large (max 5 MB)', code: 'FILE_TOO_LARGE' } });
        return;
    }
    console.error(err);
    res.status(500).json({ error: { message: isProd ? 'Something went wrong' : String(err?.message ?? err), code: 'INTERNAL' } });
};
