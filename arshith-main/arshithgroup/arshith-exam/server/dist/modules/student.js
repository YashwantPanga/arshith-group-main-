import { Router } from 'express';
import { z } from 'zod';
import { memo } from '../lib/cache.js';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { studentOnly } from '../middleware/auth.js';
import { badRequest, conflict, HttpError, notFound } from '../lib/errors.js';
import { clientIp } from '../lib/audit.js';
import { phaseOf } from '../lib/schedule.js';
import { EVENT_RULES, eventCounts } from '../lib/proctoring.js';
import { buildPaper, finalizeAttempt, gateMessage, proctoringOf, startOrResume } from './examService.js';
import { runPython } from '../lib/codeRunner.js';
import { studentFields } from './auth.js';
/* =========================== Student portal =========================== */
export const studentRouter = Router();
studentRouter.use(studentOnly);
async function scheduleTotals(assessmentId) {
    const sections = await memo(`sections:${assessmentId}`, 30000, () => prisma.assessmentSection.findMany({ where: { assessmentId } }));
    return {
        totalQuestions: sections.reduce((s, x) => s + x.questionCount, 0),
        totalMarks: Math.round(sections.reduce((s, x) => s + x.questionCount * x.marksPerQuestion, 0) * 100) / 100,
    };
}
studentRouter.get('/dashboard', async (req, res) => {
    const uid = req.user.id;
    const [profile, assignments, attempts, unread] = await Promise.all([
        prisma.studentProfile.findUniqueOrThrow({ where: { userId: uid }, include: { batch: true } }),
        prisma.examAssignment.findMany({ where: { studentId: uid, schedule: { status: { not: 'DRAFT' } } }, include: { schedule: { include: { assessment: true } } } }),
        prisma.examAttempt.findMany({ where: { studentId: uid }, include: { result: true }, orderBy: { startedAt: 'desc' } }),
        prisma.notification.count({ where: { userId: uid, readAt: null } }),
    ]);
    const exams = assignments.map((a) => {
        const s = a.schedule;
        const mine = attempts.filter((t) => t.scheduleId === s.id);
        const inProgress = mine.find((t) => t.status === 'IN_PROGRESS');
        const last = mine.find((t) => t.status !== 'IN_PROGRESS');
        const phase = phaseOf(s);
        const attemptsLeft = Math.max(0, s.maxAttempts + a.extraAttempts - mine.length);
        return {
            scheduleId: s.id, name: s.name, assessment: s.assessment.name, startAt: s.startAt, endAt: s.endAt, durationMin: s.durationMin, phase,
            attemptsUsed: mine.length, attemptsLeft, inProgress: !!inProgress,
            canStart: (phase === 'ACTIVE' && (attemptsLeft > 0 || !!inProgress)) || (!!inProgress && phase === 'PAUSED'),
            status: inProgress ? 'IN_PROGRESS' : last ? 'COMPLETED' : phase === 'ENDED' || phase === 'CANCELLED' ? 'MISSED' : 'PENDING',
            resultsPublished: s.resultsPublished, attemptId: last?.id ?? null,
        };
    });
    const results = attempts.filter((t) => t.result && assignments.find((a) => a.scheduleId === t.scheduleId)?.schedule.resultsPublished);
    res.json({
        serverTime: new Date(),
        profile: { fullName: profile.fullName, regNo: profile.regNo, college: profile.college, branch: profile.branch, batch: profile.batch?.name ?? null },
        exams: exams.sort((a, b) => +a.startAt - +b.startAt),
        results: results.map((t) => ({ attemptId: t.id, scheduleId: t.scheduleId, name: assignments.find((a) => a.scheduleId === t.scheduleId).schedule.name, obtained: t.result.obtainedMarks, total: t.result.totalMarks, percentage: t.result.percentage, passed: t.result.passed, submittedAt: t.submittedAt })),
        unreadNotifications: unread,
    });
});
studentRouter.get('/exams/:scheduleId', async (req, res) => {
    const a = await prisma.examAssignment.findUnique({ where: { scheduleId_studentId: { scheduleId: req.params.scheduleId, studentId: req.user.id } }, include: { schedule: { include: { assessment: true } } } });
    if (!a || a.schedule.status === 'DRAFT')
        throw notFound('Examination not found');
    const s = a.schedule;
    const mine = await prisma.examAttempt.findMany({ where: { scheduleId: s.id, studentId: req.user.id }, select: { status: true } });
    const used = mine.length;
    const inProgress = mine.some((m) => m.status === 'IN_PROGRESS');
    const phase = phaseOf(s);
    res.json({
        serverTime: new Date(), scheduleId: s.id, name: s.name, assessment: s.assessment.name, description: s.assessment.description, startAt: s.startAt, endAt: s.endAt,
        durationMin: s.durationMin, phase, instructions: s.instructions, negativeMarking: s.assessment.negativeMarking, maxAttempts: s.maxAttempts + a.extraAttempts, attemptsUsed: used,
        inProgress: !!inProgress, passPercent: s.passPercent ?? s.assessment.passPercent, proctoring: proctoringOf(s.assessment.proctoring), ...(await scheduleTotals(s.assessmentId)),
        sections: (await memo(`sections-cat:${s.assessmentId}`, 30000, () => prisma.assessmentSection.findMany({ where: { assessmentId: s.assessmentId }, include: { category: true }, orderBy: { position: 'asc' } }))).map((x) => ({ name: x.category.name, questions: x.questionCount, marksPerQuestion: x.marksPerQuestion, negativeMarks: s.assessment.negativeMarking ? x.negativeMarks : 0 })),
        message: phase === 'ACTIVE' ? null : gateMessage(phase, s.startAt),
    });
});
const resultShape = (r) => ({
    attemptId: r.attemptId, exam: r.schedule.name, assessment: r.schedule.assessment.name, set: r.attempt.paperSet.code, totalQuestions: r.totalQuestions,
    correct: r.correct, incorrect: r.incorrect, unattempted: r.unattempted, totalMarks: r.totalMarks, obtainedMarks: r.obtainedMarks, percentage: r.percentage,
    accuracy: r.accuracy, passed: r.passed, passPercent: r.schedule.passPercent ?? r.schedule.assessment.passPercent, sectionScores: r.sectionScores, startedAt: r.attempt.startedAt, submittedAt: r.attempt.submittedAt, timeTakenSec: r.timeTakenSec,
});
const loadOwnResult = (attemptId, studentId) => prisma.result.findFirst({ where: { attemptId, studentId, schedule: { resultsPublished: true } }, include: { schedule: { include: { assessment: true } }, attempt: { include: { paperSet: true } } } });
studentRouter.get('/results/:attemptId', async (req, res) => {
    const r = await loadOwnResult(req.params.attemptId, req.user.id);
    if (!r)
        throw notFound('Result not available yet');
    res.json(resultShape(r));
});
studentRouter.get('/notifications', async (req, res) => {
    const items = await prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 50 });
    res.json(items);
});
studentRouter.post('/notifications/read', async (req, res) => {
    await prisma.notification.updateMany({ where: { userId: req.user.id, readAt: null }, data: { readAt: new Date() } });
    res.json({ ok: true });
});
studentRouter.get('/profile', async (req, res) => {
    const p = await prisma.studentProfile.findUniqueOrThrow({ where: { userId: req.user.id }, include: { user: true, batch: true } });
    res.json({ fullName: p.fullName, email: p.user.email, mobile: p.mobile, college: p.college, regNo: p.regNo, branch: p.branch, graduationYear: p.graduationYear, batch: p.batch?.name ?? null });
});
studentRouter.put('/profile', async (req, res) => {
    const d = z.object({ fullName: studentFields.fullName, mobile: studentFields.mobile, college: studentFields.college, branch: studentFields.branch, graduationYear: studentFields.graduationYear }).parse(req.body);
    await prisma.studentProfile.update({ where: { userId: req.user.id }, data: d });
    res.json({ ok: true });
});
/* =========================== Exam engine =========================== */
export const examRouter = Router();
examRouter.use(studentOnly);
examRouter.post('/schedules/:scheduleId/start', async (req, res) => {
    const { agreed } = z.object({ agreed: z.literal(true, { errorMap: () => ({ message: 'You must accept the instructions to start' }) }) }).parse(req.body);
    void agreed;
    const attempt = await startOrResume(req.params.scheduleId, req.user.id, { ip: clientIp(req), ua: String(req.headers['user-agent'] ?? '') });
    const [paper, answers, schedule, profile] = await Promise.all([
        buildPaper(attempt),
        prisma.studentAnswer.findMany({ where: { attemptId: attempt.id } }),
        prisma.examSchedule.findUniqueOrThrow({ where: { id: attempt.scheduleId }, include: { assessment: true } }),
        prisma.studentProfile.findUniqueOrThrow({ where: { userId: req.user.id } }),
    ]);
    const totals = await scheduleTotals(schedule.assessmentId);
    res.json({
        serverTime: new Date(),
        attempt: { id: attempt.id, sessionToken: attempt.sessionToken, startedAt: attempt.startedAt, deadlineAt: attempt.deadlineAt, violationCount: attempt.violationCount },
        exam: { name: schedule.name, instructions: schedule.instructions, durationMin: schedule.durationMin, negativeMarking: schedule.assessment.negativeMarking, ...totals },
        proctoring: proctoringOf(schedule.assessment.proctoring),
        student: { fullName: profile.fullName, regNo: profile.regNo },
        ...paper,
        answers: Object.fromEntries(answers.map((a) => [a.questionId, { optionId: a.selectedOptionId, marked: a.markedForReview, visited: a.visited, code: a.code }])),
        submissions: await submissionSummary(attempt.id),
    });
});
async function submissionSummary(attemptId) {
    const rows = await prisma.codeSubmission.findMany({ where: { attemptId, kind: 'SUBMIT' }, orderBy: { createdAt: 'desc' }, select: { questionId: true, passed: true, total: true, createdAt: true, runtimeMs: true, memoryKb: true } });
    const out = {};
    for (const r of rows) {
        if (!out[r.questionId])
            out[r.questionId] = { passed: r.passed, total: r.total, at: r.createdAt, runtimeMs: r.runtimeMs, memoryKb: r.memoryKb, count: 0 };
        out[r.questionId].count++;
    }
    return out;
}
async function loadActive(req, opts = {}) {
    const attempt = await prisma.examAttempt.findUnique({ where: { id: String(req.params.id) }, include: { schedule: { include: { assessment: true } } } });
    if (!attempt || attempt.studentId !== req.user.id)
        throw notFound('Attempt not found');
    if (attempt.status !== 'IN_PROGRESS')
        throw conflict('This examination has already been submitted.', 'ALREADY_SUBMITTED');
    if (req.headers['x-session-token'] !== attempt.sessionToken)
        throw conflict('This examination was opened in another window or device. Only one session is allowed.', 'SESSION_REPLACED');
    if (Date.now() > attempt.deadlineAt.getTime() + config.SUBMIT_GRACE_SECONDS * 1000) {
        await finalizeAttempt(attempt.id, 'AUTO_SUBMITTED', 'TIME_UP');
        throw conflict('Time is up. Your answers were submitted automatically.', 'TIME_UP');
    }
    if (!opts.allowPaused && phaseOf(attempt.schedule) === 'PAUSED')
        throw new HttpError(423, 'The examination is paused by the administrator.', 'PAUSED');
    return attempt;
}
const answerInput = z.object({ optionId: z.string().uuid().nullable().optional(), markedForReview: z.boolean().optional(), visited: z.boolean().optional(), code: z.string().max(20000).optional() });
async function saveAnswer(attempt, questionId, d) {
    if (!attempt.questionOrder.includes(questionId))
        throw badRequest('Question is not part of this attempt');
    if (d.optionId && !(attempt.optionOrder[questionId] ?? []).includes(d.optionId))
        throw badRequest('Invalid option for this question');
    const data = {
        ...(d.optionId !== undefined ? { selectedOptionId: d.optionId } : {}),
        ...(d.markedForReview !== undefined ? { markedForReview: d.markedForReview } : {}),
        ...(d.visited !== undefined ? { visited: d.visited } : {}),
        ...(d.code !== undefined ? { code: d.code } : {}),
    };
    await prisma.studentAnswer.upsert({ where: { attemptId_questionId: { attemptId: attempt.id, questionId } }, update: data, create: { attemptId: attempt.id, questionId, ...data } });
}
examRouter.put('/attempts/:id/answers/:questionId', async (req, res) => {
    const attempt = await loadActive(req);
    await saveAnswer(attempt, String(req.params.questionId), answerInput.parse(req.body));
    res.json({ ok: true, savedAt: new Date() });
});
/** Bulk re-sync used after a connection drop; keeps the server consistent with the student's local state. */
examRouter.post('/attempts/:id/sync', async (req, res) => {
    const attempt = await loadActive(req);
    const { answers } = z.object({ answers: z.array(answerInput.extend({ questionId: z.string().uuid() })).max(500) }).parse(req.body);
    for (const a of answers)
        await saveAnswer(attempt, a.questionId, a);
    res.json({ ok: true, saved: answers.length });
});
/* ---- coding questions: run (visible cases) / submit (all cases) ---- */
const lastRun = new Map();
const codeBody = z.object({ questionId: z.string().uuid(), code: z.string().min(1, 'Write some code first').max(20000, 'Code is too long') });
async function executeCode(req, kind) {
    const attempt = await loadActive(req);
    const { questionId, code } = codeBody.parse(req.body);
    if (!attempt.questionOrder.includes(questionId))
        throw badRequest('Question is not part of this attempt');
    const q = await prisma.question.findUnique({ where: { id: questionId }, include: { testCases: { orderBy: { position: 'asc' } } } });
    if (!q || q.type !== 'CODING' || !q.funcName)
        throw badRequest('This is not a coding question');
    const now = Date.now();
    if (now - (lastRun.get(attempt.id) ?? 0) < 2500)
        throw new HttpError(429, 'Please wait a couple of seconds between runs.', 'RUN_COOLDOWN');
    lastRun.set(attempt.id, now);
    if (kind === 'SUBMIT' && (await prisma.codeSubmission.count({ where: { attemptId: attempt.id, questionId, kind: 'SUBMIT' } })) >= 25)
        throw conflict('Submission limit reached for this problem.', 'SUBMIT_LIMIT');
    const cases = kind === 'RUN' ? q.testCases.filter((t) => !t.isHidden) : q.testCases;
    const results = await runPython(code, q.funcName, cases.map((t) => ({ args: t.args, expected: t.expected, hasExpected: true })));
    const passed = results.filter((r) => r.ok).length;
    const runtimeMs = Math.round(results.reduce((a, r) => a + r.ms, 0) * 10) / 10;
    const memoryKb = Math.max(0, ...results.map((r) => r.memKb));
    const sub = await prisma.codeSubmission.create({ data: { attemptId: attempt.id, questionId, kind, code, passed, total: cases.length, ratio: cases.length ? passed / cases.length : 0, results: results, runtimeMs, memoryKb } });
    await prisma.studentAnswer.upsert({ where: { attemptId_questionId: { attemptId: attempt.id, questionId } }, update: { code }, create: { attemptId: attempt.id, questionId, code } });
    const shaped = cases.map((t, i) => {
        const r = results[i];
        if (t.isHidden)
            return { hidden: true, ok: r.ok, hint: r.ok ? null : t.hint, error: r.error ? (r.error.startsWith('Time limit') ? 'Time limit exceeded' : 'Runtime error') : null };
        return { hidden: false, ok: r.ok, args: t.args, expected: t.expected, actual: r.actual, error: r.error, out: r.out, ms: r.ms };
    });
    return { kind, submissionId: sub.id, passed, total: cases.length, cases: shaped, runtimeMs, memoryKb, at: sub.createdAt };
}
examRouter.post('/attempts/:id/code/run', async (req, res) => { res.json(await executeCode(req, 'RUN')); });
examRouter.post('/attempts/:id/code/submit', async (req, res) => { res.json(await executeCode(req, 'SUBMIT')); });
examRouter.get('/attempts/:id/code/:questionId/submissions', async (req, res) => {
    const a = await prisma.examAttempt.findUnique({ where: { id: String(req.params.id) } });
    if (!a || a.studentId !== req.user.id)
        throw notFound('Attempt not found');
    const rows = await prisma.codeSubmission.findMany({ where: { attemptId: a.id, questionId: String(req.params.questionId), kind: 'SUBMIT' }, orderBy: { createdAt: 'desc' }, take: 25, select: { id: true, code: true, passed: true, total: true, runtimeMs: true, memoryKb: true, createdAt: true } });
    res.json(rows);
});
const lastIp = new Map();
examRouter.post('/attempts/:id/heartbeat', async (req, res) => {
    const attempt = await loadActive(req, { allowPaused: true });
    const now = new Date();
    const gapSec = Math.round((now.getTime() - attempt.lastSeenAt.getTime()) / 1000);
    const ip = clientIp(req);
    const logs = [];
    if (gapSec > 45)
        logs.push({ attemptId: attempt.id, studentId: attempt.studentId, type: 'CONNECTION_GAP', severity: gapSec > 120 ? 'MEDIUM' : 'LOW', detail: { gapSec }, ip });
    if (attempt.startIp && ip !== attempt.startIp && lastIp.get(attempt.id) !== ip) {
        lastIp.set(attempt.id, ip);
        logs.push({ attemptId: attempt.id, studentId: attempt.studentId, type: 'IP_CHANGED', severity: 'HIGH', detail: { from: attempt.startIp, to: ip }, ip });
    }
    const msg = attempt.adminMessage;
    await prisma.$transaction([
        prisma.examAttempt.update({ where: { id: attempt.id }, data: { lastSeenAt: now, ...(msg ? { adminMessage: null } : {}) } }),
        ...(logs.length ? [prisma.examActivityLog.createMany({ data: logs })] : []),
    ]);
    const cfg = proctoringOf(attempt.schedule.assessment.proctoring);
    res.json({ serverTime: now, deadlineAt: attempt.deadlineAt, paused: phaseOf(attempt.schedule, now) === 'PAUSED', violationCount: attempt.violationCount, maxWarnings: cfg.maxWarnings, adminMessage: msg });
});
const FOCUS_FAMILY = ['TAB_HIDDEN', 'WINDOW_BLUR', 'FULLSCREEN_EXIT'];
examRouter.post('/attempts/:id/events', async (req, res) => {
    const attempt = await loadActive(req, { allowPaused: true });
    const { events } = z.object({ events: z.array(z.object({ type: z.string().max(40), detail: z.record(z.unknown()).optional() })).min(1).max(20) }).parse(req.body);
    const cfg = proctoringOf(attempt.schedule.assessment.proctoring);
    const ip = clientIp(req);
    let counted = 0;
    let tabCounted = 0;
    for (const e of events) {
        const rule = EVENT_RULES[e.type];
        if (!rule)
            continue;
        let counts = eventCounts(e.type, cfg);
        // a single "leave" incident usually fires blur + visibilitychange + fullscreenchange together: count it once
        if (counts && FOCUS_FAMILY.includes(e.type)) {
            const recent = await prisma.examActivityLog.findFirst({ where: { attemptId: attempt.id, counted: true, type: { in: FOCUS_FAMILY }, createdAt: { gt: new Date(Date.now() - 3000) } } });
            if (recent)
                counts = false;
        }
        await prisma.examActivityLog.create({ data: { attemptId: attempt.id, studentId: attempt.studentId, type: e.type, severity: rule.severity, counted: counts, detail: e.detail, ip } });
        if (counts) {
            counted++;
            if (e.type === 'TAB_HIDDEN' || e.type === 'WINDOW_BLUR')
                tabCounted++;
        }
    }
    let violationCount = attempt.violationCount;
    if (counted) {
        const upd = await prisma.examAttempt.update({ where: { id: attempt.id }, data: { violationCount: { increment: counted }, tabSwitchCount: { increment: tabCounted } } });
        violationCount = upd.violationCount;
    }
    let terminated = false;
    if (counted && cfg.autoSubmitOnLimit && violationCount >= cfg.maxWarnings) {
        await finalizeAttempt(attempt.id, 'TERMINATED', 'PROCTORING_LIMIT');
        terminated = true;
    }
    res.json({ violationCount, maxWarnings: cfg.maxWarnings, terminated });
});
examRouter.post('/attempts/:id/submit', async (req, res) => {
    const existing = await prisma.examAttempt.findUnique({ where: { id: String(req.params.id) } });
    if (!existing || existing.studentId !== req.user.id)
        throw notFound('Attempt not found');
    if (existing.status !== 'IN_PROGRESS')
        return res.json({ ok: true, status: existing.status, alreadySubmitted: true });
    if (req.headers['x-session-token'] !== existing.sessionToken)
        throw conflict('This examination was opened in another window or device.', 'SESSION_REPLACED');
    const late = Date.now() > existing.deadlineAt.getTime() + config.SUBMIT_GRACE_SECONDS * 1000;
    const done = await finalizeAttempt(existing.id, late ? 'AUTO_SUBMITTED' : 'SUBMITTED', late ? 'TIME_UP' : 'STUDENT');
    res.json({ ok: true, status: done.status });
});
/** Lets a student who was terminated/auto-submitted see why (status only – never answers). */
examRouter.get('/attempts/:id/status', async (req, res) => {
    const a = await prisma.examAttempt.findUnique({ where: { id: String(req.params.id) } });
    if (!a || a.studentId !== req.user.id)
        throw notFound('Attempt not found');
    res.json({ status: a.status, reason: a.submitReason, submittedAt: a.submittedAt });
});
