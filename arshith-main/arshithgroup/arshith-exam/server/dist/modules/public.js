import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import crypto from 'node:crypto';
import { Prisma } from '@prisma/client';
import { memo } from '../lib/cache.js';
import { prisma } from '../db.js';
import { forbidden, notFound } from '../lib/errors.js';
import { NO_PASSWORD } from '../lib/password.js';
import { signToken } from '../lib/jwt.js';
import { phaseOf } from '../lib/schedule.js';
import { fmtDateTime, notify } from '../lib/notify.js';
import { userPayload } from './auth.js';
import { readySets } from './schedules.js';
/** Unauthenticated entry for students: they only enter name, email and mobile for an exam the admin opened. */
export const publicRouter = Router();
publicRouter.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 30000, standardHeaders: true, legacyHeaders: false, validate: false, message: { error: { message: 'Too many attempts. Please try again shortly.', code: 'RATE_LIMITED' } } }));
const info = (s) => ({
    id: s.id, name: s.name, assessment: s.assessment.name, startAt: s.startAt, endAt: s.endAt, durationMin: s.durationMin, phase: phaseOf(s), serverTime: new Date(),
});
const include = { assessment: { select: { name: true } } };
const joinable = (s) => s.openEntry && ['PUBLISHED', 'PAUSED'].includes(s.status);
publicRouter.get('/open-exams', async (_req, res) => {
    // many students on the join page poll this together: answer from a 3-second cache
    const rows = await memo('open-exams', 3000, () => prisma.examSchedule.findMany({ where: { openEntry: true, status: { in: ['PUBLISHED', 'PAUSED'] }, endAt: { gt: new Date() } }, include, orderBy: { startAt: 'asc' } }));
    res.json(rows.map(info));
});
publicRouter.get('/exams/:id', async (req, res) => {
    const s = await prisma.examSchedule.findUnique({ where: { id: req.params.id }, include });
    if (!s || !joinable(s))
        throw notFound('This exam is not open for registration.');
    res.json(info(s));
});
const digits = (m) => m.replace(/\D/g, '').slice(-10);
publicRouter.post('/join', async (req, res) => {
    const d = z.object({
        scheduleId: z.string().uuid('Select an exam'),
        fullName: z.string().trim().min(2, 'Enter your name').max(100),
        email: z.string().trim().toLowerCase().email('Enter a valid email'),
        mobile: z.string().trim().regex(/^[+]?[0-9 -]{10,15}$/, 'Enter a valid mobile number'),
    }).parse(req.body);
    const s = await prisma.examSchedule.findUnique({ where: { id: d.scheduleId } });
    if (!s || !joinable(s))
        throw forbidden('This exam is not open for registration.', 'NOT_OPEN');
    if (phaseOf(s) === 'ENDED')
        throw forbidden('This exam has already ended.', 'EXAM_ENDED');
    let user = await prisma.user.findUnique({ where: { email: d.email }, include: { role: true } });
    if (user) {
        // returning student: the mobile number must match so nobody can open someone else's attempt with just an email
        if (user.role.name !== 'STUDENT')
            throw forbidden('These details cannot be used here.', 'NOT_ALLOWED');
        if (!user.isActive)
            throw forbidden('This account has been disabled. Contact the administrator.', 'ACCOUNT_DISABLED');
        const sp = await prisma.studentProfile.findUnique({ where: { userId: user.id } });
        if (sp && digits(sp.mobile) !== digits(d.mobile))
            throw forbidden('These details do not match our records for this email.', 'DETAILS_MISMATCH');
    }
    else {
        const role = await prisma.role.findUniqueOrThrow({ where: { name: 'STUDENT' } });
        for (let i = 0;; i++) {
            try {
                user = await prisma.user.create({
                    data: { email: d.email, passwordHash: NO_PASSWORD, roleId: role.id, emailVerified: true,
                        student: { create: { fullName: d.fullName, mobile: d.mobile, college: '', branch: '', graduationYear: 0, regNo: `WALK-${crypto.randomBytes(3).toString('hex').toUpperCase()}` } } },
                    include: { role: true },
                });
                break;
            }
            catch (e) {
                if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') || i >= 3)
                    throw e;
                const again = await prisma.user.findUnique({ where: { email: d.email }, include: { role: true } }); // concurrent double submit
                if (again) {
                    user = again;
                    break;
                }
            }
        }
    }
    const exists = await prisma.examAssignment.findUnique({ where: { scheduleId_studentId: { scheduleId: s.id, studentId: user.id } } });
    if (!exists) {
        let setId = s.paperSetId;
        if (s.setMode === 'ROTATE') {
            const sets = await memo(`ready:${s.assessmentId}`, 10000, () => readySets(s.assessmentId));
            if (!sets.length)
                throw forbidden('This exam is not ready yet. Please try again later.', 'NOT_READY');
            setId = sets[(await prisma.examAssignment.count({ where: { scheduleId: s.id } })) % sets.length].id;
        }
        await prisma.examAssignment.createMany({ data: [{ scheduleId: s.id, studentId: user.id, paperSetId: setId }], skipDuplicates: true });
        void notify({ userId: user.id, email: user.email, type: 'ASSIGNMENT', title: `You're registered: ${s.name}`, body: `Hi ${d.fullName}, you are registered for "${s.name}". It starts ${fmtDateTime(s.startAt)} and closes ${fmtDateTime(s.endAt)}. Duration: ${s.durationMin} minutes. Open the same link at the start time to begin.` });
    }
    res.json({ token: signToken({ sub: user.id, role: 'STUDENT' }), user: await userPayload(user.id), scheduleId: s.id });
});
