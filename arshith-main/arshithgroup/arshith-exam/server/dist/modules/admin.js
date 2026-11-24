import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import ExcelJS from 'exceljs';
import { prisma } from '../db.js';
import { adminOnly } from '../middleware/auth.js';
import { notFound } from '../lib/errors.js';
import { audit } from '../lib/audit.js';
import { phaseOf } from '../lib/schedule.js';
import { riskWeight } from '../lib/proctoring.js';
import { finalizeAttempt } from './examService.js';
import { finish, header, newDoc, sectionTitle, statCards, table } from '../lib/pdf.js';
export const adminRouter = Router();
adminRouter.use(adminOnly);
const n = (v) => (typeof v === 'bigint' ? Number(v) : Number(v ?? 0));
const r1 = (v) => Math.round(v * 10) / 10;
/* ----------------------------- dashboard ----------------------------- */
adminRouter.get('/dashboard', async (_req, res) => {
    const now = new Date();
    const [students, assessments, questions, schedules, resultAgg, passed, attempted] = await Promise.all([
        prisma.user.count({ where: { role: { name: 'STUDENT' } } }),
        prisma.assessment.count({ where: { status: { not: 'ARCHIVED' } } }),
        prisma.question.count(),
        prisma.examSchedule.findMany({ where: { status: { not: 'DRAFT' } }, include: { _count: { select: { assignments: true } }, assessment: { select: { name: true } } }, orderBy: { startAt: 'desc' } }),
        prisma.result.aggregate({ _avg: { percentage: true }, _count: true }),
        prisma.result.count({ where: { passed: true } }),
        prisma.examAttempt.findMany({ distinct: ['studentId'], select: { studentId: true } }),
    ]);
    const phases = schedules.map((s) => ({ s, phase: phaseOf(s, now) }));
    const upcomingList = phases.filter((p) => p.phase === 'UPCOMING').sort((a, b) => +a.s.startAt - +b.s.startAt).slice(0, 5);
    const [subject, daily, buckets, participationRaw] = await Promise.all([
        prisma.$queryRaw `
      SELECT s->>'name' AS name, AVG(CASE WHEN (s->>'total')::float > 0 THEN (s->>'obtained')::float / (s->>'total')::float * 100 END) AS avg
      FROM results r, jsonb_array_elements(r."sectionScores") s GROUP BY 1 ORDER BY 1`,
        prisma.$queryRaw `
      SELECT date_trunc('day', a."submittedAt") AS day, COUNT(*) AS attempts, AVG(r.percentage) AS avg
      FROM exam_attempts a LEFT JOIN results r ON r."attemptId" = a.id
      WHERE a."submittedAt" IS NOT NULL AND a."submittedAt" > now() - interval '14 days' GROUP BY 1 ORDER BY 1`,
        prisma.$queryRaw `
      SELECT LEAST(FLOOR(GREATEST(percentage, 0) / 10), 9)::int AS bucket, COUNT(*) AS c FROM results GROUP BY 1 ORDER BY 1`,
        prisma.examAttempt.groupBy({ by: ['scheduleId'], where: { scheduleId: { in: schedules.slice(0, 8).map((s) => s.id) } }, _count: { studentId: true } }),
    ]);
    const distinctPerSchedule = await prisma.examAttempt.findMany({ where: { scheduleId: { in: schedules.slice(0, 8).map((s) => s.id) } }, distinct: ['scheduleId', 'studentId'], select: { scheduleId: true } });
    void participationRaw;
    const attendedBy = new Map();
    for (const d of distinctPerSchedule)
        attendedBy.set(d.scheduleId, (attendedBy.get(d.scheduleId) ?? 0) + 1);
    const liveList = phases.filter((p) => ['ACTIVE', 'PAUSED'].includes(p.phase)).slice(0, 6);
    const [running, submittedBy, recent] = await Promise.all([
        prisma.examAttempt.groupBy({ by: ['scheduleId'], where: { status: 'IN_PROGRESS', scheduleId: { in: liveList.map((x) => x.s.id) } }, _count: true }),
        prisma.examAttempt.groupBy({ by: ['scheduleId'], where: { status: { not: 'IN_PROGRESS' }, scheduleId: { in: liveList.map((x) => x.s.id) } }, _count: true }),
        prisma.result.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { schedule: { select: { name: true } }, attempt: { include: { student: { include: { student: true } } } } } }),
    ]);
    const liveOut = liveList.map((x) => ({ id: x.s.id, name: x.s.name, phase: x.phase, endAt: x.s.endAt, assigned: x.s._count.assignments, inProgress: running.find((r) => r.scheduleId === x.s.id)?._count ?? 0, submitted: submittedBy.find((r) => r.scheduleId === x.s.id)?._count ?? 0 }));
    const recentOut = recent.map((r) => ({ id: r.id, attemptId: r.attemptId, student: r.attempt.student.student?.fullName ?? r.attempt.student.email, exam: r.schedule.name, obtained: r.obtainedMarks, total: r.totalMarks, percentage: r.percentage, passed: r.passed, at: r.attempt.submittedAt }));
    res.json({
        totals: {
            students, assessments, questions, upcoming: phases.filter((p) => p.phase === 'UPCOMING').length, active: phases.filter((p) => ['ACTIVE', 'PAUSED'].includes(p.phase)).length,
            completed: phases.filter((p) => p.phase === 'ENDED').length, studentsAttempted: attempted.length,
            passPercentage: resultAgg._count ? r1((passed / resultAgg._count) * 100) : 0, averageScore: r1(resultAgg._avg.percentage ?? 0),
        },
        participation: schedules.slice(0, 8).reverse().map((s) => ({ name: s.name.length > 22 ? s.name.slice(0, 20) + '…' : s.name, assigned: s._count.assignments, attended: attendedBy.get(s.id) ?? 0 })),
        performance: Array.from({ length: 10 }, (_, i) => ({ range: `${i * 10}-${i === 9 ? 100 : i * 10 + 9}`, students: n(buckets.find((b) => b.bucket === i)?.c) })),
        subjectWise: subject.map((s) => ({ subject: s.name, average: r1(Number(s.avg ?? 0)) })),
        daily: daily.map((d) => ({ day: d.day.toISOString().slice(5, 10), attempts: n(d.attempts), average: r1(Number(d.avg ?? 0)) })),
        live: liveOut, recent: recentOut,
        upcoming: upcomingList.map((p) => ({ id: p.s.id, name: p.s.name, assessment: p.s.assessment.name, startAt: p.s.startAt, assigned: p.s._count.assignments })),
    });
});
/* ----------------------------- analytics ----------------------------- */
const aFilters = z.object({ scheduleId: z.string().uuid().optional(), assessmentId: z.string().uuid().optional() });
async function analytics(f) {
    const rw = f.scheduleId ? Prisma.sql `AND r."scheduleId" = ${f.scheduleId}` : f.assessmentId ? Prisma.sql `AND s."assessmentId" = ${f.assessmentId}` : Prisma.empty;
    const baseJoin = Prisma.sql `FROM results r JOIN exam_schedules s ON s.id = r."scheduleId"`;
    const [assessmentWise, batchWise, sectionWise, ranking, passFail, attendance, questionStats] = await Promise.all([
        prisma.$queryRaw `
      SELECT a.name, COUNT(*) AS attempts, AVG(r.percentage) AS avg, COUNT(*) FILTER (WHERE r.passed) AS passed
      FROM results r JOIN exam_schedules s ON s.id = r."scheduleId" JOIN assessments a ON a.id = s."assessmentId" WHERE 1=1 ${rw} GROUP BY a.name ORDER BY a.name`,
        prisma.$queryRaw `
      SELECT COALESCE(b.name, 'No batch') AS name, COUNT(DISTINCT r."studentId") AS students, AVG(r.percentage) AS avg, COUNT(*) FILTER (WHERE r.passed) AS passed
      FROM results r JOIN exam_schedules s ON s.id = r."scheduleId" JOIN student_profiles sp ON sp."userId" = r."studentId" LEFT JOIN batches b ON b.id = sp."batchId" WHERE 1=1 ${rw} GROUP BY 1 ORDER BY 1`,
        prisma.$queryRaw `
      SELECT sec->>'name' AS name,
        AVG(CASE WHEN (sec->>'total')::float > 0 THEN (sec->>'obtained')::float / (sec->>'total')::float * 100 END) AS avg,
        AVG(CASE WHEN (sec->>'correct')::int + (sec->>'incorrect')::int > 0 THEN (sec->>'correct')::float / ((sec->>'correct')::int + (sec->>'incorrect')::int) * 100 END) AS accuracy
      FROM results r JOIN exam_schedules s ON s.id = r."scheduleId", jsonb_array_elements(r."sectionScores") sec WHERE 1=1 ${rw} GROUP BY 1 ORDER BY 1`,
        prisma.$queryRaw `
      SELECT r."studentId", sp."fullName" AS name, sp."regNo", AVG(r.percentage) AS avg, MAX(r.percentage) AS best, COUNT(*) AS tests
      FROM results r JOIN exam_schedules s ON s.id = r."scheduleId" JOIN student_profiles sp ON sp."userId" = r."studentId" WHERE 1=1 ${rw} GROUP BY r."studentId", sp."fullName", sp."regNo" ORDER BY avg DESC`,
        prisma.$queryRaw `
      SELECT COUNT(*) FILTER (WHERE r.passed) AS passed, COUNT(*) FILTER (WHERE NOT r.passed) AS failed ${baseJoin} WHERE 1=1 ${rw}`,
        prisma.$queryRaw `
      SELECT s.name, (SELECT COUNT(*) FROM exam_assignments ea WHERE ea."scheduleId" = s.id) AS assigned,
             (SELECT COUNT(DISTINCT a."studentId") FROM exam_attempts a WHERE a."scheduleId" = s.id) AS attended
      FROM exam_schedules s WHERE s.status <> 'DRAFT' ${f.scheduleId ? Prisma.sql `AND s.id = ${f.scheduleId}` : f.assessmentId ? Prisma.sql `AND s."assessmentId" = ${f.assessmentId}` : Prisma.empty}
      ORDER BY s."startAt" DESC LIMIT 20`,
        prisma.$queryRaw `
      SELECT q.id, q.text, c.name AS category, q.difficulty::text AS difficulty,
        COUNT(*) FILTER (WHERE sa."selectedOptionId" IS NOT NULL) AS attempted,
        COUNT(*) FILTER (WHERE o."isCorrect") AS correct, COUNT(*) AS seen
      FROM student_answers sa JOIN exam_attempts a ON a.id = sa."attemptId" AND a.status <> 'IN_PROGRESS'
      JOIN exam_schedules s ON s.id = a."scheduleId" JOIN questions q ON q.id = sa."questionId" JOIN question_categories c ON c.id = q."categoryId"
      LEFT JOIN question_options o ON o.id = sa."selectedOptionId" WHERE 1=1 ${f.scheduleId ? Prisma.sql `AND a."scheduleId" = ${f.scheduleId}` : f.assessmentId ? Prisma.sql `AND s."assessmentId" = ${f.assessmentId}` : Prisma.empty}
      GROUP BY q.id, q.text, c.name, q.difficulty HAVING COUNT(*) FILTER (WHERE sa."selectedOptionId" IS NOT NULL) > 0`,
    ]);
    const qa = questionStats.map((q) => {
        const attempted = n(q.attempted), correct = n(q.correct);
        const pct = attempted ? (correct / attempted) * 100 : 0;
        return { id: q.id, text: q.text, category: q.category, labelled: q.difficulty, attempted, correct, incorrect: attempted - correct, correctPct: r1(pct), observed: pct >= 70 ? 'Easy' : pct >= 40 ? 'Medium' : 'Hard' };
    });
    const rank = ranking.map((r) => ({ studentId: r.studentId, name: r.name, regNo: r.regNo, average: r1(Number(r.avg)), best: r1(Number(r.best)), tests: n(r.tests) }));
    return {
        assessmentWise: assessmentWise.map((a) => ({ name: a.name, attempts: n(a.attempts), average: r1(Number(a.avg)), passRate: r1((n(a.passed) / Math.max(1, n(a.attempts))) * 100) })),
        batchWise: batchWise.map((b) => ({ name: b.name, students: n(b.students), average: r1(Number(b.avg)), passRate: r1((n(b.passed) / Math.max(1, n(b.students))) * 100) })),
        sectionWise: sectionWise.map((s) => ({ name: s.name, average: r1(Number(s.avg ?? 0)), accuracy: r1(Number(s.accuracy ?? 0)) })),
        topStudents: rank.slice(0, 10), lowestStudents: [...rank].reverse().slice(0, 10),
        passFail: { passed: n(passFail[0]?.passed), failed: n(passFail[0]?.failed) },
        attendance: attendance.map((a) => ({ name: a.name, assigned: n(a.assigned), attended: n(a.attended), percentage: n(a.assigned) ? r1((n(a.attended) / n(a.assigned)) * 100) : 0 })),
        frequentlyIncorrect: [...qa].filter((q) => q.attempted >= 1).sort((a, b) => b.incorrect - a.incorrect).slice(0, 15),
        hardestQuestions: [...qa].sort((a, b) => a.correctPct - b.correctPct).slice(0, 15),
        questionDifficulty: ['Easy', 'Medium', 'Hard'].map((d) => ({ level: d, count: qa.filter((q) => q.observed === d).length })),
    };
}
adminRouter.get('/analytics', async (req, res) => res.json(await analytics(aFilters.parse(req.query))));
adminRouter.get('/analytics/export', async (req, res) => {
    const f = aFilters.parse(req.query);
    const format = req.query.format === 'pdf' ? 'pdf' : 'xlsx';
    const a = await analytics(f);
    if (format === 'xlsx') {
        const wb = new ExcelJS.Workbook();
        const add = (name, cols, rows) => {
            const ws = wb.addWorksheet(name);
            ws.addRow(cols);
            rows.forEach((r) => ws.addRow(r));
            ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
            ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF12352C' } };
            ws.columns.forEach((c) => { c.width = 22; });
        };
        add('Assessment-wise', ['Assessment', 'Attempts', 'Average %', 'Pass rate %'], a.assessmentWise.map((x) => [x.name, x.attempts, x.average, x.passRate]));
        add('Batch-wise', ['Batch', 'Students', 'Average %', 'Pass rate %'], a.batchWise.map((x) => [x.name, x.students, x.average, x.passRate]));
        add('Section-wise', ['Section', 'Average %', 'Accuracy %'], a.sectionWise.map((x) => [x.name, x.average, x.accuracy]));
        add('Top students', ['Name', 'Reg no', 'Average %', 'Best %', 'Tests'], a.topStudents.map((x) => [x.name, x.regNo, x.average, x.best, x.tests]));
        add('Lowest students', ['Name', 'Reg no', 'Average %', 'Best %', 'Tests'], a.lowestStudents.map((x) => [x.name, x.regNo, x.average, x.best, x.tests]));
        add('Attendance', ['Exam', 'Assigned', 'Attended', 'Attendance %'], a.attendance.map((x) => [x.name, x.assigned, x.attended, x.percentage]));
        add('Question analysis', ['Question', 'Category', 'Labelled', 'Observed', 'Attempted', 'Correct', 'Correct %'], [...a.frequentlyIncorrect, ...a.hardestQuestions].map((x) => [x.text, x.category, x.labelled, x.observed, x.attempted, x.correct, x.correctPct]));
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="analytics-report.xlsx"');
        await wb.xlsx.write(res);
        return res.end();
    }
    const doc = newDoc(res, 'analytics-report', 'Analytics report');
    header(doc, 'PERFORMANCE ANALYTICS', 'Assessment, batch and question insights');
    sectionTitle(doc, 'Overview');
    const tot = a.passFail.passed + a.passFail.failed;
    statCards(doc, [{ label: 'Results', value: String(tot), accent: true }, { label: 'Passed', value: String(a.passFail.passed) }, { label: 'Failed', value: String(a.passFail.failed) }, { label: 'Pass rate', value: tot ? `${r1((a.passFail.passed / tot) * 100)}%` : '—' }]);
    sectionTitle(doc, 'Assessment-wise performance');
    table(doc, [{ label: 'Assessment', width: 235 }, { label: 'Attempts', width: 90, align: 'right' }, { label: 'Average %', width: 90, align: 'right' }, { label: 'Pass rate %', width: 100, align: 'right' }], a.assessmentWise.map((x) => [x.name, String(x.attempts), String(x.average), String(x.passRate)]));
    sectionTitle(doc, 'Batch-wise performance');
    table(doc, [{ label: 'Batch', width: 235 }, { label: 'Students', width: 90, align: 'right' }, { label: 'Average %', width: 90, align: 'right' }, { label: 'Pass rate %', width: 100, align: 'right' }], a.batchWise.map((x) => [x.name, String(x.students), String(x.average), String(x.passRate)]));
    sectionTitle(doc, 'Section-wise performance');
    table(doc, [{ label: 'Section', width: 235 }, { label: 'Average %', width: 140, align: 'right' }, { label: 'Accuracy %', width: 140, align: 'right' }], a.sectionWise.map((x) => [x.name, String(x.average), String(x.accuracy)]));
    sectionTitle(doc, 'Top performing students');
    table(doc, [{ label: 'Student', width: 200 }, { label: 'Reg. no.', width: 100 }, { label: 'Average %', width: 105, align: 'right' }, { label: 'Tests', width: 110, align: 'right' }], a.topStudents.map((x) => [x.name, x.regNo, String(x.average), String(x.tests)]));
    sectionTitle(doc, 'Frequently incorrect questions');
    table(doc, [{ label: 'Question', width: 290 }, { label: 'Category', width: 100 }, { label: 'Incorrect', width: 60, align: 'right' }, { label: 'Correct %', width: 65, align: 'right' }], a.frequentlyIncorrect.map((x) => [x.text, x.category, String(x.incorrect), String(x.correctPct)]));
    finish(doc, 'Analytics report');
});
/* ----------------------------- live proctoring ----------------------------- */
async function riskByAttempt(ids) {
    if (!ids.length)
        return new Map();
    const g = await prisma.examActivityLog.groupBy({ by: ['attemptId', 'type', 'severity'], where: { attemptId: { in: ids }, OR: [{ counted: true }, { severity: 'HIGH' }] }, _count: true });
    const m = new Map();
    for (const x of g) {
        const cur = m.get(x.attemptId) ?? { risk: 0, high: 0 };
        cur.risk += riskWeight(x.type) * x._count;
        if (x.severity === 'HIGH')
            cur.high += x._count;
        m.set(x.attemptId, cur);
    }
    return m;
}
const attemptInclude = { student: { include: { student: true } }, schedule: { select: { id: true, name: true, assessment: { select: { proctoring: true } } } }, paperSet: { select: { code: true } } };
const attemptRow = (a, risk) => ({
    id: a.id, scheduleId: a.scheduleId, exam: a.schedule.name, student: a.student.student?.fullName ?? '', regNo: a.student.student?.regNo ?? '', studentId: a.studentId, set: a.paperSet.code, status: a.status,
    startedAt: a.startedAt, deadlineAt: a.deadlineAt, submittedAt: a.submittedAt, submitReason: a.submitReason, lastSeenAt: a.lastSeenAt, online: Date.now() - a.lastSeenAt.getTime() < 30000,
    violations: a.violationCount, tabSwitches: a.tabSwitchCount, risk: risk?.risk ?? 0, highEvents: risk?.high ?? 0, startIp: a.startIp,
    maxWarnings: a.schedule.assessment.proctoring?.maxWarnings ?? 3,
});
/** Just the number of students writing right now — polled by the app header, so it must stay cheap. */
adminRouter.get('/proctoring/live-count', async (_req, res) => {
    res.json({ writing: await prisma.examAttempt.count({ where: { status: 'IN_PROGRESS' } }) });
});
adminRouter.get('/proctoring/live', async (req, res) => {
    const scheduleId = typeof req.query.scheduleId === 'string' ? req.query.scheduleId : undefined;
    const attempts = await prisma.examAttempt.findMany({ where: { status: 'IN_PROGRESS', ...(scheduleId ? { scheduleId } : {}) }, include: attemptInclude, orderBy: { startedAt: 'desc' }, take: 500 });
    const risk = await riskByAttempt(attempts.map((a) => a.id));
    const recent = await prisma.examActivityLog.findMany({ where: { severity: { in: ['HIGH', 'MEDIUM'] }, createdAt: { gt: new Date(Date.now() - 15 * 60000) } }, orderBy: { createdAt: 'desc' }, take: 25, include: { attempt: { include: { student: { include: { student: true } } } } } });
    res.json({
        serverTime: new Date(), total: await prisma.examAttempt.count({ where: { status: 'IN_PROGRESS', ...(scheduleId ? { scheduleId } : {}) } }), attempts: attempts.map((a) => attemptRow(a, risk.get(a.id))),
        recentEvents: recent.map((l) => ({ id: l.id, type: l.type, severity: l.severity, counted: l.counted, at: l.createdAt, attemptId: l.attemptId, student: l.attempt.student.student?.fullName ?? '', regNo: l.attempt.student.student?.regNo ?? '' })),
    });
});
adminRouter.get('/proctoring/incidents', async (req, res) => {
    const q = z.object({ scheduleId: z.string().uuid().optional(), minRisk: z.coerce.number().min(0).default(1) }).parse(req.query);
    const flagged = await prisma.examActivityLog.findMany({ where: { OR: [{ counted: true }, { severity: 'HIGH' }], ...(q.scheduleId ? { attempt: { scheduleId: q.scheduleId } } : {}) }, distinct: ['attemptId'], select: { attemptId: true }, take: 1000 });
    const attempts = await prisma.examAttempt.findMany({ where: { id: { in: flagged.map((f) => f.attemptId) } }, include: attemptInclude, orderBy: { startedAt: 'desc' } });
    const risk = await riskByAttempt(attempts.map((a) => a.id));
    res.json(attempts.map((a) => attemptRow(a, risk.get(a.id))).filter((a) => a.risk >= q.minRisk).sort((a, b) => b.risk - a.risk));
});
adminRouter.get('/proctoring/attempts/:id', async (req, res) => {
    const a = await prisma.examAttempt.findUnique({ where: { id: req.params.id }, include: attemptInclude });
    if (!a)
        throw notFound('Attempt not found');
    const [logs, risk, answered] = await Promise.all([
        prisma.examActivityLog.findMany({ where: { attemptId: a.id }, orderBy: { createdAt: 'desc' }, take: 500 }),
        riskByAttempt([a.id]), prisma.studentAnswer.count({ where: { attemptId: a.id, selectedOptionId: { not: null } } }),
    ]);
    res.json({ ...attemptRow(a, risk.get(a.id)), answered, totalQuestions: a.questionOrder.length, userAgent: a.userAgent, logs });
});
adminRouter.post('/proctoring/attempts/:id/warn', async (req, res) => {
    const { message } = z.object({ message: z.string().trim().min(3, 'Write a message').max(300) }).parse(req.body);
    const a = await prisma.examAttempt.findUnique({ where: { id: req.params.id } });
    if (!a)
        throw notFound('Attempt not found');
    await prisma.$transaction([
        prisma.examAttempt.update({ where: { id: a.id }, data: { adminMessage: message } }),
        prisma.examActivityLog.create({ data: { attemptId: a.id, studentId: a.studentId, type: 'ADMIN_WARNING', severity: 'INFO', detail: { message } } }),
    ]);
    await audit(req, 'PROCTOR_WARN', 'ExamAttempt', a.id, { message });
    res.json({ ok: true });
});
adminRouter.post('/proctoring/attempts/:id/terminate', async (req, res) => {
    const { reason } = z.object({ reason: z.string().trim().max(200).optional() }).parse(req.body ?? {});
    const a = await prisma.examAttempt.findUnique({ where: { id: req.params.id } });
    if (!a)
        throw notFound('Attempt not found');
    await prisma.examActivityLog.create({ data: { attemptId: a.id, studentId: a.studentId, type: 'ADMIN_TERMINATED', severity: 'HIGH', detail: { reason: reason ?? null } } });
    await finalizeAttempt(a.id, 'TERMINATED', 'ADMIN_TERMINATED');
    await audit(req, 'PROCTOR_TERMINATE', 'ExamAttempt', a.id, { reason });
    res.json({ ok: true });
});
/* ----------------------------- audit & email logs ----------------------------- */
adminRouter.get('/audit', async (req, res) => {
    const q = z.object({ search: z.string().optional(), entity: z.string().optional(), page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(200).default(30) }).parse(req.query);
    const where = { ...(q.entity ? { entity: q.entity } : {}), ...(q.search ? { OR: [{ action: { contains: q.search, mode: 'insensitive' } }, { actor: { email: { contains: q.search, mode: 'insensitive' } } }] } : {}) };
    const [total, items] = await Promise.all([prisma.auditLog.count({ where }), prisma.auditLog.findMany({ where, include: { actor: { select: { email: true } } }, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize })]);
    res.json({ total, page: q.page, pageSize: q.pageSize, items: items.map((a) => ({ id: a.id, action: a.action, entity: a.entity, entityId: a.entityId, actor: a.actor?.email ?? 'system', meta: a.meta, ip: a.ip, createdAt: a.createdAt })) });
});
adminRouter.get('/emails', async (req, res) => {
    const q = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20) }).parse(req.query);
    const [total, items] = await Promise.all([prisma.emailLog.count(), prisma.emailLog.findMany({ orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize })]);
    res.json({ total, page: q.page, pageSize: q.pageSize, items });
});
