import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { adminOnly } from '../middleware/auth.js';
import { badRequest, conflict, notFound } from '../lib/errors.js';
import { audit } from '../lib/audit.js';
import { addMinutes, phaseOf } from '../lib/schedule.js';
import { fmtDateTime, notify } from '../lib/notify.js';
import { finalizeAllActive } from './examService.js';
export const schedulesRouter = Router();
schedulesRouter.use(adminOnly);
const input = z.object({
    name: z.string().trim().min(3, 'Name must be at least 3 characters').max(150),
    assessmentId: z.string().uuid('Select an assessment'),
    setMode: z.enum(['FIXED', 'ROTATE']).default('FIXED'),
    paperSetId: z.string().uuid().nullable().optional(),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    durationMin: z.coerce.number().int().min(1).max(600),
    maxAttempts: z.coerce.number().int().min(1).max(10).default(1),
    /** Pass mark for this exam; left out, the paper's pass mark applies. */
    passPercent: z.coerce.number().min(0).max(100).optional(),
    instructions: z.string().trim().max(5000).optional().nullable(),
    openEntry: z.boolean().default(false),
    /** "Go live now": the server's own clock sets the window, so a phone with a wrong time cannot create a future exam. */
    startNow: z.boolean().optional(),
    joinMinutes: z.coerce.number().int().min(5).max(1440).optional(),
});
async function validate(raw) {
    const { startNow, joinMinutes, ...d } = raw;
    if (startNow) {
        d.startAt = new Date(Date.now() - 30000);
        d.endAt = addMinutes(new Date(), (joinMinutes ?? 30) + d.durationMin);
    }
    if (d.endAt <= d.startAt)
        throw badRequest('End time must be after the start time');
    if ((d.endAt.getTime() - d.startAt.getTime()) / 60000 < d.durationMin)
        throw badRequest('The exam window is shorter than the duration. Extend the end time or reduce the duration.');
    const a = await prisma.assessment.findUnique({ where: { id: d.assessmentId }, include: { sets: true } });
    if (!a)
        throw badRequest('Assessment not found');
    if (d.setMode === 'FIXED') {
        if (!d.paperSetId)
            throw badRequest('Select the paper set for this examination');
        if (!a.sets.some((s) => s.id === d.paperSetId))
            throw badRequest('The chosen paper set does not belong to this assessment');
    }
    return { ...d, paperSetId: d.setMode === 'FIXED' ? d.paperSetId : null };
}
/** Sets that are complete (all section counts met) – only these may be given to students. */
export async function readySets(assessmentId) {
    const sections = await prisma.assessmentSection.findMany({ where: { assessmentId } });
    const sets = await prisma.paperSet.findMany({ where: { assessmentId }, orderBy: { code: 'asc' }, include: { questions: { select: { sectionId: true } } } });
    return sets.filter((s) => sections.length > 0 && sections.every((sec) => s.questions.filter((q) => q.sectionId === sec.id).length === sec.questionCount));
}
const listSelect = {
    assessment: { select: { id: true, name: true } }, paperSet: { select: { code: true } },
    _count: { select: { assignments: true, attempts: true } },
};
const shape = (s, extra = {}) => ({
    id: s.id, name: s.name, assessmentId: s.assessmentId, assessment: s.assessment.name, setMode: s.setMode, paperSetId: s.paperSetId, set: s.paperSet?.code ?? null,
    startAt: s.startAt, endAt: s.endAt, durationMin: s.durationMin, maxAttempts: s.maxAttempts, instructions: s.instructions, status: s.status, phase: phaseOf(s),
    resultsPublished: s.resultsPublished, openEntry: s.openEntry, pausedAt: s.pausedAt, assigned: s._count.assignments, attempts: s._count.attempts, ...extra,
});
schedulesRouter.get('/', async (req, res) => {
    const q = z.object({ phase: z.enum(['DRAFT', 'UPCOMING', 'ACTIVE', 'PAUSED', 'ENDED', 'CANCELLED']).optional(), assessmentId: z.string().optional(), search: z.string().optional() }).parse(req.query);
    const rows = await prisma.examSchedule.findMany({
        where: { ...(q.assessmentId ? { assessmentId: q.assessmentId } : {}), ...(q.search ? { name: { contains: q.search, mode: 'insensitive' } } : {}) },
        include: listSelect, orderBy: { startAt: 'desc' },
    });
    const ids = rows.map((r) => r.id);
    const [submitted, running] = await Promise.all([
        prisma.examAttempt.groupBy({ by: ['scheduleId'], where: { scheduleId: { in: ids }, status: { not: 'IN_PROGRESS' } }, _count: true }),
        prisma.examAttempt.groupBy({ by: ['scheduleId'], where: { scheduleId: { in: ids }, status: 'IN_PROGRESS' }, _count: true }),
    ]);
    const sub = new Map(submitted.map((x) => [x.scheduleId, x._count]));
    const run = new Map(running.map((x) => [x.scheduleId, x._count]));
    const out = rows.map((r) => shape(r, { submitted: sub.get(r.id) ?? 0, inProgress: run.get(r.id) ?? 0 })).filter((r) => !q.phase || r.phase === q.phase);
    res.json(out);
});
schedulesRouter.post('/', async (req, res) => {
    const d = await validate(input.parse(req.body));
    const s = await prisma.examSchedule.create({ data: { ...d, instructions: d.instructions || null, createdById: req.user.id }, include: listSelect });
    await audit(req, 'CREATE_SCHEDULE', 'ExamSchedule', s.id, { name: s.name });
    res.status(201).json(shape(s));
});
schedulesRouter.get('/:id', async (req, res) => {
    const s = await prisma.examSchedule.findUnique({ where: { id: req.params.id }, include: { ...listSelect, assessment: { select: { id: true, name: true, durationMin: true, passPercent: true, negativeMarking: true } } } });
    if (!s)
        throw notFound('Examination not found');
    const [assignments, attempts, sets] = await Promise.all([
        // only the columns this page shows: attempts carry large question/option order data that must not be loaded here
        prisma.examAssignment.findMany({ where: { scheduleId: s.id }, select: { id: true, studentId: true, extraAttempts: true, student: { select: { email: true, student: { select: { fullName: true, mobile: true, regNo: true } } } }, paperSet: { select: { code: true } } }, orderBy: { assignedAt: 'asc' } }),
        prisma.examAttempt.findMany({ where: { scheduleId: s.id }, orderBy: { startedAt: 'desc' }, select: { id: true, studentId: true, status: true, violationCount: true, result: { select: { obtainedMarks: true, totalMarks: true, percentage: true, passed: true } } } }),
        readySets(s.assessmentId),
    ]);
    const latest = new Map();
    const used = new Map();
    for (const a of attempts) {
        if (!latest.has(a.studentId))
            latest.set(a.studentId, a);
        used.set(a.studentId, (used.get(a.studentId) ?? 0) + 1);
    }
    res.json({
        ...shape(s, { readySets: sets.map((x) => ({ id: x.id, code: x.code })) }),
        passPercent: s.passPercent ?? s.assessment.passPercent, negativeMarking: s.assessment.negativeMarking,
        candidates: assignments.map((a) => {
            const att = latest.get(a.studentId);
            return {
                assignmentId: a.id, studentId: a.studentId, fullName: a.student.student?.fullName, mobile: a.student.student?.mobile, regNo: a.student.student?.regNo, email: a.student.email, batch: null,
                set: a.paperSet?.code ?? s.paperSet?.code ?? null, extraAttempts: a.extraAttempts, attemptsUsed: used.get(a.studentId) ?? 0,
                attemptId: att?.id ?? null, attemptStatus: att?.status ?? 'NOT_STARTED', violations: att?.violationCount ?? 0,
                obtained: att?.result?.obtainedMarks ?? null, total: att?.result?.totalMarks ?? null, percentage: att?.result?.percentage ?? null, passed: att?.result?.passed ?? null,
            };
        }),
    });
});
schedulesRouter.put('/:id', async (req, res) => {
    const s = await prisma.examSchedule.findUnique({ where: { id: req.params.id } });
    if (!s)
        throw notFound('Examination not found');
    const d = await validate(input.parse(req.body));
    const attempts = await prisma.examAttempt.count({ where: { scheduleId: s.id } });
    if (attempts && (d.assessmentId !== s.assessmentId || d.setMode !== s.setMode || d.paperSetId !== s.paperSetId || d.durationMin !== s.durationMin || +d.startAt !== +s.startAt || (d.passPercent !== undefined && d.passPercent !== (s.passPercent ?? undefined)))) {
        throw conflict('Students have already started this examination. Only the name, end time, attempts and instructions can be changed (use "Extend time" to add time).', 'SCHEDULE_LOCKED');
    }
    const upd = await prisma.examSchedule.update({ where: { id: s.id }, data: { ...d, instructions: d.instructions || null }, include: listSelect });
    if (d.setMode === 'FIXED')
        await prisma.examAssignment.updateMany({ where: { scheduleId: s.id }, data: { paperSetId: d.paperSetId } });
    await audit(req, 'UPDATE_SCHEDULE', 'ExamSchedule', s.id);
    res.json(shape(upd));
});
schedulesRouter.delete('/:id', async (req, res) => {
    if (await prisma.examAttempt.count({ where: { scheduleId: req.params.id } }))
        throw conflict('Students have attempted this examination. Cancel it instead of deleting it.', 'HAS_ATTEMPTS');
    await prisma.examSchedule.delete({ where: { id: req.params.id } });
    await audit(req, 'DELETE_SCHEDULE', 'ExamSchedule', req.params.id);
    res.json({ ok: true });
});
/* ------------ lifecycle controls ------------ */
const getSchedule = async (id) => {
    const s = await prisma.examSchedule.findUnique({ where: { id } });
    if (!s)
        throw notFound('Examination not found');
    return s;
};
schedulesRouter.post('/:id/publish', async (req, res) => {
    const s = await getSchedule(req.params.id);
    if (!['DRAFT', 'CANCELLED'].includes(s.status))
        throw conflict('Only draft or cancelled examinations can be published.');
    const a = await prisma.assessment.findUniqueOrThrow({ where: { id: s.assessmentId } });
    if (a.status !== 'PUBLISHED')
        throw badRequest('Publish the assessment first.', 'ASSESSMENT_NOT_PUBLISHED');
    const ready = await readySets(a.id);
    if (s.setMode === 'FIXED' && !ready.some((r) => r.id === s.paperSetId))
        throw badRequest('The selected paper set is incomplete. Fill every section before publishing.', 'SET_INCOMPLETE');
    if (s.setMode === 'ROTATE' && !ready.length)
        throw badRequest('No complete paper sets are available for rotation.', 'SET_INCOMPLETE');
    if (s.endAt <= new Date())
        throw badRequest('The examination window has already ended. Edit the schedule first.');
    if (!s.openEntry && !(await prisma.examAssignment.count({ where: { scheduleId: s.id } })))
        throw badRequest('Assign students or batches, or turn on open entry, before publishing.', 'NO_CANDIDATES');
    if (s.setMode === 'ROTATE')
        await rotateSets(s.id, ready.map((r) => r.id));
    await prisma.examSchedule.update({ where: { id: s.id }, data: { status: 'PUBLISHED', pausedAt: null } });
    await audit(req, 'PUBLISH_SCHEDULE', 'ExamSchedule', s.id);
    res.json({ ok: true });
});
async function rotateSets(scheduleId, setIds) {
    const rows = await prisma.examAssignment.findMany({ where: { scheduleId }, orderBy: { assignedAt: 'asc' }, select: { id: true, paperSetId: true } });
    let i = 0;
    for (const r of rows) {
        if (!r.paperSetId || !setIds.includes(r.paperSetId))
            await prisma.examAssignment.update({ where: { id: r.id }, data: { paperSetId: setIds[i % setIds.length] } });
        i++;
    }
}
schedulesRouter.post('/:id/pause', async (req, res) => {
    const s = await getSchedule(req.params.id);
    if (s.status !== 'PUBLISHED' || phaseOf(s) === 'ENDED')
        throw conflict('Only a published, running or upcoming examination can be paused.');
    await prisma.examSchedule.update({ where: { id: s.id }, data: { status: 'PAUSED', pausedAt: new Date() } });
    await audit(req, 'PAUSE_SCHEDULE', 'ExamSchedule', s.id);
    res.json({ ok: true });
});
/** Resuming gives every running student the paused time back and moves the window end by the same amount. */
schedulesRouter.post('/:id/resume', async (req, res) => {
    const s = await getSchedule(req.params.id);
    if (s.status !== 'PAUSED')
        throw conflict('This examination is not paused.');
    const now = new Date();
    const from = s.pausedAt && s.pausedAt > s.startAt ? s.pausedAt : s.startAt;
    const deltaMs = Math.max(0, now.getTime() - from.getTime());
    await prisma.$transaction(async (tx) => {
        if (deltaMs > 0 && now > s.startAt) {
            await tx.$executeRaw `UPDATE "exam_attempts" SET "deadlineAt" = "deadlineAt" + (${deltaMs} * interval '1 millisecond') WHERE "scheduleId" = ${s.id} AND "status" = 'IN_PROGRESS'`;
            await tx.examSchedule.update({ where: { id: s.id }, data: { endAt: new Date(s.endAt.getTime() + deltaMs) } });
        }
        await tx.examSchedule.update({ where: { id: s.id }, data: { status: 'PUBLISHED', pausedAt: null } });
    });
    await audit(req, 'RESUME_SCHEDULE', 'ExamSchedule', s.id, { compensatedSec: Math.round(deltaMs / 1000) });
    res.json({ ok: true, compensatedSec: Math.round(deltaMs / 1000) });
});
schedulesRouter.post('/:id/extend', async (req, res) => {
    const { minutes } = z.object({ minutes: z.coerce.number().int().min(1, 'Enter at least 1 minute').max(240, 'Maximum extension is 240 minutes') }).parse(req.body);
    const s = await getSchedule(req.params.id);
    if (!['PUBLISHED', 'PAUSED', 'CLOSED'].includes(s.status))
        throw conflict('Only published examinations can be extended.');
    const base = s.endAt > new Date() ? s.endAt : new Date();
    const endAt = addMinutes(s.status === 'CLOSED' ? new Date() : base, minutes);
    await prisma.$transaction(async (tx) => {
        await tx.examSchedule.update({ where: { id: s.id }, data: { endAt, ...(s.status === 'CLOSED' ? { status: 'PUBLISHED' } : {}) } });
        await tx.$executeRaw `UPDATE "exam_attempts" SET "deadlineAt" = "deadlineAt" + (${minutes} * interval '1 minute') WHERE "scheduleId" = ${s.id} AND "status" = 'IN_PROGRESS'`;
    });
    await audit(req, 'EXTEND_SCHEDULE', 'ExamSchedule', s.id, { minutes });
    res.json({ ok: true, endAt });
});
schedulesRouter.post('/:id/close', async (req, res) => {
    const s = await getSchedule(req.params.id);
    if (!['PUBLISHED', 'PAUSED'].includes(s.status))
        throw conflict('Only a published examination can be closed.');
    await prisma.examSchedule.update({ where: { id: s.id }, data: { status: 'CLOSED' } });
    const n = await finalizeAllActive(s.id, 'AUTO_SUBMITTED', 'ADMIN_CLOSED');
    await audit(req, 'CLOSE_SCHEDULE', 'ExamSchedule', s.id, { submitted: n });
    res.json({ ok: true, submitted: n });
});
schedulesRouter.post('/:id/cancel', async (req, res) => {
    const s = await getSchedule(req.params.id);
    if (s.status === 'CANCELLED')
        throw conflict('Already cancelled.');
    await prisma.examSchedule.update({ where: { id: s.id }, data: { status: 'CANCELLED' } });
    const n = await finalizeAllActive(s.id, 'TERMINATED', 'EXAM_CANCELLED');
    const people = await prisma.examAssignment.findMany({ where: { scheduleId: s.id }, include: { student: true } });
    for (const p of people)
        void notify({ userId: p.studentId, email: p.student.email, type: 'EXAM_CANCELLED', title: 'Examination cancelled', body: `"${s.name}" has been cancelled by the administrator.` });
    await audit(req, 'CANCEL_SCHEDULE', 'ExamSchedule', s.id, { terminated: n });
    res.json({ ok: true, terminated: n });
});
/* ------------ candidates ------------ */
schedulesRouter.post('/:id/assign', async (req, res) => {
    const { studentIds = [], batchIds = [] } = z.object({ studentIds: z.array(z.string().uuid()).optional(), batchIds: z.array(z.string().uuid()).optional() }).parse(req.body);
    if (!studentIds.length && !batchIds.length)
        throw badRequest('Select at least one student or batch');
    const s = await getSchedule(req.params.id);
    if (s.status === 'CANCELLED' || phaseOf(s) === 'ENDED')
        throw conflict('This examination has ended or been cancelled.');
    const profiles = await prisma.studentProfile.findMany({
        where: { user: { isActive: true }, OR: [{ userId: { in: studentIds } }, { batchId: { in: batchIds } }] },
        include: { user: true },
    });
    const existing = new Set((await prisma.examAssignment.findMany({ where: { scheduleId: s.id }, select: { studentId: true } })).map((x) => x.studentId));
    const fresh = profiles.filter((p) => !existing.has(p.userId));
    const setIds = s.setMode === 'ROTATE' ? (await readySets(s.assessmentId)).map((x) => x.id) : [];
    const offset = existing.size;
    await prisma.examAssignment.createMany({
        data: fresh.map((p, i) => ({ scheduleId: s.id, studentId: p.userId, paperSetId: s.setMode === 'FIXED' ? s.paperSetId : setIds.length ? setIds[(offset + i) % setIds.length] : null })),
        skipDuplicates: true,
    });
    for (const p of fresh)
        void notify({
            userId: p.userId, email: p.user.email, type: 'ASSIGNMENT', title: `Assessment assigned: ${s.name}`,
            body: `You have been assigned "${s.name}". Scheduled: ${fmtDateTime(s.startAt)} to ${fmtDateTime(s.endAt)}. Duration: ${s.durationMin} minutes.`, cta: { label: 'Open exam', path: `/join/${s.id}` },
        });
    await audit(req, 'ASSIGN_CANDIDATES', 'ExamSchedule', s.id, { added: fresh.length, skipped: profiles.length - fresh.length });
    res.json({ added: fresh.length, alreadyAssigned: profiles.length - fresh.length });
});
schedulesRouter.delete('/:id/assignments/:studentId', async (req, res) => {
    if (await prisma.examAttempt.count({ where: { scheduleId: req.params.id, studentId: req.params.studentId } }))
        throw conflict('This student has already attempted the exam and cannot be removed.', 'HAS_ATTEMPTS');
    await prisma.examAssignment.deleteMany({ where: { scheduleId: req.params.id, studentId: req.params.studentId } });
    await audit(req, 'UNASSIGN_CANDIDATE', 'ExamSchedule', req.params.id, { studentId: req.params.studentId });
    res.json({ ok: true });
});
schedulesRouter.post('/:id/assignments/:studentId/grant-attempt', async (req, res) => {
    const a = await prisma.examAssignment.update({ where: { scheduleId_studentId: { scheduleId: req.params.id, studentId: req.params.studentId } }, data: { extraAttempts: { increment: 1 } } });
    await audit(req, 'GRANT_ATTEMPT', 'ExamSchedule', req.params.id, { studentId: req.params.studentId });
    res.json({ extraAttempts: a.extraAttempts });
});
schedulesRouter.post('/:id/remind', async (req, res) => {
    const s = await getSchedule(req.params.id);
    const people = await prisma.examAssignment.findMany({ where: { scheduleId: s.id, student: { attempts: { none: { scheduleId: s.id } } } }, include: { student: true } });
    for (const p of people)
        void notify({ userId: p.studentId, email: p.student.email, type: 'REMINDER', title: `Reminder: ${s.name}`, body: `"${s.name}" is scheduled for ${fmtDateTime(s.startAt)} (closes ${fmtDateTime(s.endAt)}).`, cta: { label: 'Open exam', path: `/join/${s.id}` } });
    await audit(req, 'SEND_REMINDERS', 'ExamSchedule', s.id, { count: people.length });
    res.json({ sent: people.length });
});
schedulesRouter.post('/:id/results-visibility', async (req, res) => {
    const { published } = z.object({ published: z.boolean() }).parse(req.body);
    const s = await getSchedule(req.params.id);
    if (published) {
        if (phaseOf(s) !== 'ENDED')
            throw conflict('Results can be published only after the examination has ended.', 'NOT_ENDED');
        await finalizeAllActive(s.id, 'AUTO_SUBMITTED', 'TIME_UP');
    }
    await prisma.examSchedule.update({ where: { id: s.id }, data: { resultsPublished: published } });
    // Students never see marks (they only get the closing screen), so nothing is sent to them here.
    const notified = 0;
    await audit(req, published ? 'PUBLISH_RESULTS' : 'UNPUBLISH_RESULTS', 'ExamSchedule', s.id, { notified });
    res.json({ ok: true, notified });
});
