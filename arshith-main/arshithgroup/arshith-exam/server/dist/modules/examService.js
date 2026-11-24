import { Prisma } from '@prisma/client';
import { memo } from '../lib/cache.js';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { conflict, forbidden, HttpError } from '../lib/errors.js';
import { randomToken } from '../lib/password.js';
import { evaluate } from '../lib/scoring.js';
import { phaseOf, addMinutes } from '../lib/schedule.js';
import { defaultProctoring } from '../lib/proctoring.js';
import { notify, fmtDateTime } from '../lib/notify.js';
const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};
export const proctoringOf = (raw) => ({ ...defaultProctoring(), ...raw });
/* Finalising touches several tables. When thousands submit at the same moment, each worker scores at most
 * FINALIZE_SLOTS attempts at once and the rest wait their turn in memory — so the database pool stays free for
 * students who are still answering, and no submission fails with "unable to start a transaction". */
const FINALIZE_SLOTS = 6;
let running = 0;
const waiting = [];
async function slot(fn) {
    if (running >= FINALIZE_SLOTS)
        await new Promise((r) => waiting.push(r));
    running++;
    try {
        return await fn();
    }
    finally {
        running--;
        waiting.shift()?.();
    }
}
/** Scores an attempt and writes the Result. Claiming the attempt is atomic, so double submits are harmless. */
export async function finalizeAttempt(attemptId, status, reason) {
    return slot(() => finalizeNow(attemptId, status, reason));
}
async function finalizeNow(attemptId, status, reason) {
    const now = new Date();
    const att = await prisma.examAttempt.findUniqueOrThrow({ where: { id: attemptId }, include: { schedule: { include: { assessment: true } } } });
    if (att.status !== 'IN_PROGRESS')
        return att;
    // the paper never changes during an exam: read it (cached) outside the transaction
    const aqs = await paperSetQuestions(att.paperSetId);
    const scored = aqs.map((q) => ({
        questionId: q.questionId, sectionId: q.sectionId, sectionName: q.section.category.name, marks: q.marks, negativeMarks: q.negativeMarks,
        correctOptionId: q.question.options.find((o) => o.isCorrect)?.id ?? '', kind: q.question.type,
    }));
    const submittedAt = reason === 'TIME_UP' && att.deadlineAt < now ? att.deadlineAt : now;
    const done = await prisma.$transaction(async (tx) => {
        const claim = await tx.examAttempt.updateMany({ where: { id: attemptId, status: 'IN_PROGRESS' }, data: { status, submittedAt, submitReason: reason } });
        if (claim.count === 0)
            return null; // someone else already finalised it
        // answers are read after the claim, so a save that raced the submit is either in or rejected — never half-counted
        const [answers, subs] = await Promise.all([
            tx.studentAnswer.findMany({ where: { attemptId }, select: { questionId: true, selectedOptionId: true } }),
            tx.codeSubmission.findMany({ where: { attemptId, kind: 'SUBMIT' }, orderBy: { createdAt: 'desc' }, select: { questionId: true, ratio: true } }),
        ]);
        const codeRatios = new Map();
        for (const sb of subs)
            if (!codeRatios.has(sb.questionId))
                codeRatios.set(sb.questionId, sb.ratio);
        const ev = evaluate(scored, new Map(answers.map((a) => [a.questionId, a.selectedOptionId])), codeRatios, {
            negativeMarking: att.schedule.assessment.negativeMarking, passPercent: att.schedule.passPercent ?? att.schedule.assessment.passPercent,
        });
        const timeTakenSec = Math.max(0, Math.round((submittedAt.getTime() - att.startedAt.getTime()) / 1000));
        await tx.result.upsert({
            where: { attemptId },
            update: {},
            create: { attemptId, scheduleId: att.scheduleId, studentId: att.studentId, ...ev, sectionScores: ev.sectionScores, timeTakenSec },
        });
        await tx.examActivityLog.create({ data: { attemptId, studentId: att.studentId, type: `SUBMITTED_${reason}`, severity: reason === 'STUDENT' ? 'INFO' : 'LOW', detail: { status } } });
        return { att, submittedAt };
    }, { maxWait: 30000, timeout: 30000 });
    if (done) {
        const u = await prisma.user.findUnique({ where: { id: done.att.studentId }, include: { student: true } });
        if (u)
            void notify({
                userId: u.id, email: u.email, type: 'SUBMISSION', title: 'Examination submitted',
                body: `Hi ${u.student?.fullName ?? ''}, your attempt for "${done.att.schedule.name}" was received at ${fmtDateTime(done.submittedAt)}${status === 'TERMINATED' ? ' (the exam was ended automatically)' : status === 'AUTO_SUBMITTED' ? ' (auto-submitted)' : ''}. Thank you for taking the exam — we wish you the very best.`,
            });
    }
    return prisma.examAttempt.findUniqueOrThrow({ where: { id: attemptId } });
}
/** Auto-submits every in-progress attempt whose deadline (plus grace) has passed. */
export async function autoSubmitDue() {
    const cutoff = new Date(Date.now() - config.SUBMIT_GRACE_SECONDS * 1000);
    const due = await prisma.examAttempt.findMany({ where: { status: 'IN_PROGRESS', deadlineAt: { lt: cutoff } }, select: { id: true } });
    for (const a of due)
        await finalizeAttempt(a.id, 'AUTO_SUBMITTED', 'TIME_UP').catch((e) => console.error('auto-submit failed', a.id, e));
    return due.length;
}
export async function finalizeAllActive(scheduleId, status, reason) {
    const active = await prisma.examAttempt.findMany({ where: { scheduleId, status: 'IN_PROGRESS' }, select: { id: true } });
    for (const a of active)
        await finalizeAttempt(a.id, status, reason);
    return active.length;
}
/** Builds the question payload for a student – NEVER includes correct answers or explanations. */
/** Questions of one paper set; cached briefly because every student of a big exam asks for the same set at the same moment. */
export const paperSetQuestions = (paperSetId) => memo(`paper:${paperSetId}`, 30000, () => prisma.assessmentQuestion.findMany({
    where: { paperSetId }, orderBy: { position: 'asc' },
    include: { question: { include: { options: true, testCases: { orderBy: { position: 'asc' } } } }, section: { include: { category: true } } },
}));
export async function buildPaper(attempt) {
    const aqs = await paperSetQuestions(attempt.paperSetId);
    const byId = new Map(aqs.map((q) => [q.questionId, q]));
    const qOrder = attempt.questionOrder;
    const oOrder = attempt.optionOrder;
    const sections = new Map();
    const questions = qOrder.flatMap((qid) => {
        const aq = byId.get(qid);
        if (!aq)
            return [];
        const opts = new Map(aq.question.options.map((o) => [o.id, o]));
        const sec = sections.get(aq.sectionId) ?? { id: aq.sectionId, name: aq.section.category.name, position: aq.section.position, total: 0 };
        sec.total++;
        sections.set(aq.sectionId, sec);
        return [{
                id: qid, type: aq.question.type, title: aq.question.title, sectionId: aq.sectionId, text: aq.question.text, topic: aq.question.topic, difficulty: aq.question.difficulty, marks: aq.marks, negativeMarks: aq.negativeMarks,
                ...(aq.question.type === 'CODING' ? {
                    starterCode: aq.question.starterCode, paramNames: aq.question.paramNames, constraints: aq.question.constraints ?? [],
                    // only the visible cases are ever sent; hidden cases (and their expected output) stay on the server
                    examples: aq.question.testCases.filter((t) => !t.isHidden).map((t) => ({ args: t.args, expected: t.expected })),
                    hiddenCount: aq.question.testCases.filter((t) => t.isHidden).length,
                } : {}),
                options: (oOrder[qid] ?? []).flatMap((oid) => (opts.get(oid) ? [{ id: oid, text: opts.get(oid).text }] : [])),
            }];
    });
    return { questions, sections: [...sections.values()].sort((a, b) => a.position - b.position) };
}
async function orderingFor(paperSetId, shuffleQ, shuffleO) {
    const aqs = await paperSetQuestions(paperSetId);
    const bySection = new Map();
    for (const q of aqs)
        bySection.set(q.sectionId, [...(bySection.get(q.sectionId) ?? []), q]);
    const questionOrder = [];
    const optionOrder = {};
    for (const list of bySection.values())
        for (const q of shuffleQ ? shuffle(list) : list)
            questionOrder.push(q.questionId);
    for (const q of aqs) {
        const opts = [...q.question.options].sort((a, b) => a.position - b.position);
        optionOrder[q.questionId] = (shuffleO ? shuffle(opts) : opts).map((o) => o.id);
    }
    return { questionOrder, optionOrder };
}
export function gateMessage(phase, startAt) {
    switch (phase) {
        case 'UPCOMING': return `This examination has not started yet. It opens at ${fmtDateTime(startAt)}.`;
        case 'PAUSED': return 'This examination has been paused by the administrator. Please wait for it to resume.';
        case 'ENDED': return 'This examination has ended.';
        case 'CANCELLED': return 'This examination has been cancelled.';
        default: return 'This examination is not available.';
    }
}
export async function startOrResume(scheduleId, studentId, ctx) {
    const assignment = await prisma.examAssignment.findUnique({ where: { scheduleId_studentId: { scheduleId, studentId } } });
    if (!assignment)
        throw forbidden('You are not eligible for this examination.', 'NOT_ASSIGNED');
    const schedule = await prisma.examSchedule.findUniqueOrThrow({ where: { id: scheduleId }, include: { assessment: true } });
    const now = new Date();
    // 1. resume an in-progress attempt (page refresh / reconnect / new device) – rotating the session token kicks the old session out
    let attempt = await prisma.examAttempt.findFirst({ where: { scheduleId, studentId, status: 'IN_PROGRESS' } });
    if (attempt && now.getTime() > attempt.deadlineAt.getTime() + config.SUBMIT_GRACE_SECONDS * 1000) {
        await finalizeAttempt(attempt.id, 'AUTO_SUBMITTED', 'TIME_UP');
        throw conflict('Your time for this examination is over. Your answers were submitted automatically.', 'TIME_UP');
    }
    const phase = phaseOf(schedule, now);
    if (attempt) {
        if (phase === 'CANCELLED' || phase === 'DRAFT')
            throw forbidden(gateMessage(phase, schedule.startAt), 'EXAM_UNAVAILABLE');
        const gap = Math.round((now.getTime() - attempt.lastSeenAt.getTime()) / 1000);
        const token = randomToken();
        attempt = await prisma.examAttempt.update({ where: { id: attempt.id }, data: { sessionToken: token, lastSeenAt: now } });
        await prisma.examActivityLog.createMany({ data: [
                { attemptId: attempt.id, studentId, type: 'RECONNECT', severity: 'LOW', detail: { offlineSec: gap }, ip: ctx.ip },
                ...(gap < 120 ? [{ attemptId: attempt.id, studentId, type: 'PAGE_REFRESH_OR_NEW_SESSION', severity: 'INFO', detail: { offlineSec: gap }, ip: ctx.ip }] : []),
            ] });
        return attempt;
    }
    // 2. new attempt
    if (phase !== 'ACTIVE')
        throw forbidden(gateMessage(phase, schedule.startAt), `EXAM_${phase}`);
    const used = await prisma.examAttempt.count({ where: { scheduleId, studentId } });
    if (used >= schedule.maxAttempts + assignment.extraAttempts)
        throw forbidden('You have used all your attempts for this examination.', 'ATTEMPTS_EXHAUSTED');
    const deadline = new Date(Math.min(addMinutes(now, schedule.durationMin).getTime(), schedule.endAt.getTime()));
    if (deadline.getTime() - now.getTime() < 60000)
        throw forbidden('The examination window is about to close; it is too late to start.', 'TOO_LATE');
    const setId = assignment.paperSetId ?? schedule.paperSetId;
    if (!setId)
        throw new HttpError(500, 'No paper set is configured for this examination. Contact the administrator.');
    const { questionOrder, optionOrder } = await orderingFor(setId, schedule.assessment.shuffleQuestions, schedule.assessment.shuffleOptions);
    if (!questionOrder.length)
        throw new HttpError(500, 'The paper has no questions. Contact the administrator.');
    try {
        const created = await prisma.examAttempt.create({
            data: {
                scheduleId, studentId, paperSetId: setId, attemptNo: used + 1, startedAt: now, deadlineAt: deadline, questionOrder, optionOrder,
                sessionToken: randomToken(), startIp: ctx.ip, userAgent: ctx.ua.slice(0, 300),
            },
        });
        await prisma.examActivityLog.create({ data: { attemptId: created.id, studentId, type: 'EXAM_STARTED', severity: 'INFO', detail: { attemptNo: created.attemptNo, ua: ctx.ua.slice(0, 200) }, ip: ctx.ip } });
        return created;
    }
    catch (e) {
        // concurrent start (double click / two tabs): fall back to the attempt that won the race
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            const existing = await prisma.examAttempt.findFirst({ where: { scheduleId, studentId, status: 'IN_PROGRESS' } });
            if (existing)
                return prisma.examAttempt.update({ where: { id: existing.id }, data: { sessionToken: randomToken(), lastSeenAt: now } });
        }
        throw e;
    }
}
