import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { adminOnly } from '../middleware/auth.js';
import { notFound } from '../lib/errors.js';
import { audit } from '../lib/audit.js';
import { buildWorkbook, buildRankedWorkbook, sendWorkbook } from '../lib/excel.js';
import { badge, fmtDt, fmtDur, finish, header, keyValues, newDoc, sectionTitle, statCards, table } from '../lib/pdf.js';
import { riskWeight } from '../lib/proctoring.js';
export const resultsRouter = Router();
resultsRouter.use(adminOnly);
const include = {
    attempt: { include: { paperSet: true, student: { include: { student: { include: { batch: true } } } } } },
    schedule: { include: { assessment: true } },
};
const row = (r) => ({
    id: r.id, attemptId: r.attemptId, scheduleId: r.scheduleId, studentId: r.studentId,
    student: r.attempt.student.student?.fullName ?? '', mobile: r.attempt.student.student?.mobile ?? '', regNo: r.attempt.student.student?.regNo ?? '', email: r.attempt.student.email, batch: r.attempt.student.student?.batch?.name ?? '',
    college: r.attempt.student.student?.college ?? '', assessment: r.schedule.assessment.name, exam: r.schedule.name, set: r.attempt.paperSet.code, attemptNo: r.attempt.attemptNo,
    totalQuestions: r.totalQuestions, correct: r.correct, incorrect: r.incorrect, unattempted: r.unattempted, totalMarks: r.totalMarks, obtainedMarks: r.obtainedMarks,
    percentage: r.percentage, accuracy: r.accuracy, passed: r.passed, startedAt: r.attempt.startedAt, submittedAt: r.attempt.submittedAt, timeTakenSec: r.timeTakenSec,
    status: r.attempt.status, violations: r.attempt.violationCount, sectionScores: r.sectionScores,
});
const filters = z.object({
    scheduleId: z.string().optional(), assessmentId: z.string().optional(), batchId: z.string().optional(), result: z.enum(['pass', 'fail']).optional(),
    from: z.coerce.date().optional(), to: z.coerce.date().optional(), search: z.string().optional(),
    sort: z.enum(['marks', 'name', 'time', 'date']).default('date'), dir: z.enum(['asc', 'desc']).default('desc'),
    page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(500).default(20),
});
function whereOf(q) {
    return {
        ...(q.scheduleId ? { scheduleId: q.scheduleId } : {}),
        ...(q.assessmentId ? { schedule: { assessmentId: q.assessmentId } } : {}),
        ...(q.result ? { passed: q.result === 'pass' } : {}),
        ...(q.from || q.to ? { attempt: { submittedAt: { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) } } } : {}),
        ...(q.batchId || q.search ? { attempt: { student: { student: {
                        ...(q.batchId ? { batchId: q.batchId } : {}),
                        ...(q.search ? { OR: [{ fullName: { contains: q.search, mode: 'insensitive' } }, { regNo: { contains: q.search, mode: 'insensitive' } }] } : {}),
                    } } } } : {}),
    };
}
// Prisma can't merge two `attempt` keys, so combine date + student filters explicitly
function whereMerged(q) {
    const w = whereOf(q);
    if ((q.from || q.to) && (q.batchId || q.search)) {
        const { attempt: _a, ...rest } = w;
        void _a;
        return { ...rest, AND: [{ attempt: { submittedAt: { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) } } }, { attempt: { student: { student: { ...(q.batchId ? { batchId: q.batchId } : {}), ...(q.search ? { OR: [{ fullName: { contains: q.search, mode: 'insensitive' } }, { regNo: { contains: q.search, mode: 'insensitive' } }] } : {}) } } } }] };
    }
    return w;
}
const orderOf = (q) => q.sort === 'marks' ? [{ obtainedMarks: q.dir }, { timeTakenSec: 'asc' }]
    : q.sort === 'time' ? [{ timeTakenSec: q.dir }]
        : q.sort === 'name' ? [{ attempt: { student: { student: { fullName: q.dir } } } }]
            : [{ createdAt: q.dir }];
resultsRouter.get('/', async (req, res) => {
    const q = filters.parse(req.query);
    const where = whereMerged(q);
    const [total, items] = await Promise.all([
        prisma.result.count({ where }),
        prisma.result.findMany({ where, include, orderBy: orderOf(q), skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    ]);
    const agg = await prisma.result.aggregate({ where, _avg: { percentage: true, obtainedMarks: true }, _max: { obtainedMarks: true } });
    const passed = await prisma.result.count({ where: { AND: [where, { passed: true }] } });
    res.json({ total, page: q.page, pageSize: q.pageSize, items: items.map(row), summary: { passed, failed: total - passed, avgPercentage: Math.round((agg._avg.percentage ?? 0) * 100) / 100, highest: agg._max.obtainedMarks ?? 0 } });
});
/** Only the columns the ranked list needs — with thousands of students the full nested include was slow. */
const leanSelect = {
    id: true, attemptId: true, scheduleId: true, studentId: true, totalQuestions: true, correct: true, incorrect: true, unattempted: true,
    totalMarks: true, obtainedMarks: true, percentage: true, accuracy: true, passed: true, timeTakenSec: true, sectionScores: true,
    attempt: { select: { status: true, violationCount: true, startedAt: true, submittedAt: true, attemptNo: true, paperSet: { select: { code: true } }, student: { select: { email: true, student: { select: { fullName: true, mobile: true, regNo: true } } } } } },
};
/** Best attempt per student for an exam, ranked by percentage (sets may differ in total marks), then marks, then speed. */
async function meritFor(scheduleId) {
    const [sch, results] = await Promise.all([
        prisma.examSchedule.findUniqueOrThrow({ where: { id: scheduleId }, select: { name: true, assessment: { select: { name: true } } } }),
        prisma.result.findMany({ where: { scheduleId }, select: leanSelect }),
    ]);
    const best = new Map();
    for (const r of results) {
        const cur = best.get(r.studentId);
        if (!cur || r.percentage > cur.percentage || (r.percentage === cur.percentage && (r.obtainedMarks > cur.obtainedMarks || (r.obtainedMarks === cur.obtainedMarks && r.timeTakenSec < cur.timeTakenSec))))
            best.set(r.studentId, r);
    }
    return [...best.values()].sort((a, b) => b.percentage - a.percentage || b.obtainedMarks - a.obtainedMarks || a.timeTakenSec - b.timeTakenSec).map((r, i) => ({
        rank: i + 1, id: r.id, attemptId: r.attemptId, scheduleId: r.scheduleId, studentId: r.studentId,
        student: r.attempt.student.student?.fullName ?? '', mobile: r.attempt.student.student?.mobile ?? '', regNo: r.attempt.student.student?.regNo ?? '', email: r.attempt.student.email, batch: '', college: '',
        assessment: sch.assessment.name, exam: sch.name, set: r.attempt.paperSet.code, attemptNo: r.attempt.attemptNo,
        totalQuestions: r.totalQuestions, correct: r.correct, incorrect: r.incorrect, unattempted: r.unattempted, totalMarks: r.totalMarks, obtainedMarks: r.obtainedMarks,
        percentage: r.percentage, accuracy: r.accuracy, passed: r.passed, startedAt: r.attempt.startedAt, submittedAt: r.attempt.submittedAt, timeTakenSec: r.timeTakenSec,
        status: r.attempt.status, violations: r.attempt.violationCount, sectionScores: r.sectionScores,
    }));
}
resultsRouter.get('/merit', async (req, res) => {
    const { scheduleId, passedOnly } = z.object({ scheduleId: z.string().uuid(), passedOnly: z.coerce.boolean().optional() }).parse(req.query);
    const list = await meritFor(scheduleId);
    res.json(passedOnly ? list.filter((r) => r.passed) : list);
});
resultsRouter.get('/export', async (req, res) => {
    const q = filters.parse({ ...req.query, page: 1, pageSize: 500 });
    const format = req.query.format === 'csv' ? 'csv' : 'xlsx';
    const merit = req.query.merit === 'true' && q.scheduleId; // ranked list: best attempt per student, highest percentage first
    const rows = merit ? await meritFor(q.scheduleId) : (await prisma.result.findMany({ where: whereMerged(q), include, orderBy: orderOf(q), take: 20000 })).map((r, i) => ({ rank: i + 1, ...row(r) }));
    const sectionNames = [...new Set(rows.flatMap((r) => r.sectionScores.map((x) => x.name)))];
    const mmss = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
    if (merit && format === 'xlsx') {
        // the ranked sheet admins actually use: only what is needed to shortlist, highest percentage first
        const sch = await prisma.examSchedule.findUniqueOrThrow({ where: { id: q.scheduleId }, include: { assessment: true } });
        const wb = buildRankedWorkbook({
            title: `${config.ORG_NAME} — ${sch.name}`,
            subtitle: `Ranked list · exam on ${fmtDt(sch.startAt)} · highest percentage first`,
            passPercent: sch.passPercent ?? sch.assessment.passPercent,
            columns: [
                { header: 'Rank', key: 'rank', width: 7, kind: 'num' }, { header: 'Name', key: 'student', width: 26, kind: 'text' }, { header: 'Mobile', key: 'mobile', width: 14, kind: 'text' },
                { header: 'Email', key: 'email', width: 30, kind: 'text' }, { header: 'Set', key: 'set', width: 6, kind: 'num' },
                ...sectionNames.map((n, i) => ({ header: n, key: `sec${i}`, width: 15, kind: 'num' })),
                { header: 'Total', key: 'obtainedMarks', width: 9, kind: 'num' }, { header: 'Out of', key: 'totalMarks', width: 8, kind: 'num' },
                { header: 'Percentage', key: 'percentage', width: 12, kind: 'pct' }, { header: 'Result', key: 'resultText', width: 9, kind: 'result' }, { header: 'Time taken', key: 'timeText', width: 11, kind: 'num' },
            ],
            rows: rows.map((r) => ({ ...r, resultText: r.passed ? 'PASS' : 'FAIL', timeText: mmss(r.timeTakenSec), ...Object.fromEntries(sectionNames.map((n, i) => [`sec${i}`, r.sectionScores.find((x) => x.name === n)?.obtained ?? 0])) })),
        });
        await audit(req, 'EXPORT_RESULTS', 'Result', null, { format, rows: rows.length, ranked: true });
        const safe = sch.name.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'exam';
        await sendWorkbook(res, wb, `ranked-${safe}`, 'xlsx');
        return;
    }
    const wb = buildWorkbook(merit ? 'Merit list' : 'Results', [
        { header: merit ? 'Rank' : '#', key: 'rank', width: 7 }, { header: 'Student', key: 'student', width: 24 }, { header: 'Email', key: 'email', width: 28 }, { header: 'Mobile', key: 'mobile', width: 14 },
        { header: 'Reg No', key: 'regNo', width: 14 }, { header: 'Batch', key: 'batch', width: 14 }, { header: 'Exam', key: 'exam', width: 30 }, { header: 'Set', key: 'set', width: 6 },
        ...sectionNames.map((n, i) => ({ header: `${n} (marks)`, key: `sec${i}`, width: 20 })),
        { header: 'Total obtained', key: 'obtainedMarks', width: 14 }, { header: 'Out of', key: 'totalMarks', width: 9 }, { header: 'Percentage', key: 'percentage', width: 11 },
        { header: 'Correct', key: 'correct', width: 9 }, { header: 'Incorrect', key: 'incorrect', width: 9 }, { header: 'Unattempted', key: 'unattempted', width: 12 }, { header: 'Accuracy %', key: 'accuracy', width: 11 },
        { header: 'Result', key: 'resultText', width: 8 }, { header: 'Time taken (mm:ss)', key: 'timeText', width: 17 }, { header: 'Submitted', key: 'submittedAt', width: 20 },
        { header: 'Violations', key: 'violations', width: 10 }, { header: 'Status', key: 'status', width: 16 },
    ], rows.map((r) => ({
        ...r, resultText: r.passed ? 'PASS' : 'FAIL', timeText: mmss(r.timeTakenSec), submittedAt: fmtDt(r.submittedAt),
        ...Object.fromEntries(sectionNames.map((n, i) => [`sec${i}`, r.sectionScores.find((x) => x.name === n)?.obtained ?? 0])),
    })));
    await audit(req, 'EXPORT_RESULTS', 'Result', null, { format, rows: rows.length });
    await sendWorkbook(res, wb, merit ? 'merit-list' : 'results', format);
});
resultsRouter.get('/:attemptId', async (req, res) => {
    const r = await prisma.result.findUnique({ where: { attemptId: req.params.attemptId }, include });
    if (!r)
        throw notFound('Result not found');
    const logs = await prisma.examActivityLog.findMany({ where: { attemptId: r.attemptId }, orderBy: { createdAt: 'asc' }, take: 300 });
    const subs = await prisma.codeSubmission.findMany({ where: { attemptId: r.attemptId, kind: 'SUBMIT' }, orderBy: { createdAt: 'desc' }, include: { question: { select: { title: true, marks: true } } } });
    const seen = new Set();
    const coding = subs.filter((x) => (seen.has(x.questionId) ? false : (seen.add(x.questionId), true))).map((x) => ({ questionId: x.questionId, title: x.question.title, passed: x.passed, total: x.total, ratio: x.ratio, code: x.code, at: x.createdAt, submissions: subs.filter((y) => y.questionId === x.questionId).length }));
    res.json({ ...row(r), logs, coding });
});
/* ---------------- PDFs ---------------- */
resultsRouter.get('/:attemptId/pdf', async (req, res) => {
    const r = await prisma.result.findUnique({ where: { attemptId: req.params.attemptId }, include });
    if (!r)
        throw notFound('Result not found');
    const d = row(r);
    const logs = await prisma.examActivityLog.findMany({ where: { attemptId: r.attemptId, counted: true } });
    const risk = logs.reduce((s, l) => s + riskWeight(l.type), 0);
    const doc = newDoc(res, `result-${d.student.replace(/[^\w]+/g, '-') || d.attemptId}`, `Result — ${d.student}`);
    header(doc, 'CANDIDATE SCORECARD', d.exam);
    sectionTitle(doc, 'Candidate details');
    keyValues(doc, [['Name', d.student], ['Mobile', d.mobile], ['Email', d.email], ['Paper set', d.set]]);
    sectionTitle(doc, 'Examination');
    keyValues(doc, [['Assessment', d.assessment], ['Examination', d.exam], ['Started', fmtDt(d.startedAt)], ['Submitted', fmtDt(d.submittedAt)], ['Time taken', fmtDur(d.timeTakenSec)], ['Submission', d.status.replace('_', ' ')]]);
    sectionTitle(doc, 'Performance summary');
    statCards(doc, [
        { label: 'Marks obtained', value: `${d.obtainedMarks} / ${d.totalMarks}`, accent: true }, { label: 'Percentage', value: `${d.percentage}%` },
        { label: 'Accuracy', value: `${d.accuracy}%` }, { label: 'Pass mark', value: `${r.schedule.passPercent ?? r.schedule.assessment.passPercent}%` },
    ]);
    badge(doc, d.passed ? 'RESULT: PASS' : 'RESULT: FAIL', d.passed, 40, doc.y);
    doc.y += 30;
    keyValues(doc, [['Total questions', String(d.totalQuestions)], ['Correct', String(d.correct)], ['Incorrect', String(d.incorrect)], ['Unattempted', String(d.unattempted)]], 4);
    sectionTitle(doc, 'Section-wise performance');
    table(doc, [{ label: 'Section', width: 175 }, { label: 'Correct', width: 70, align: 'right' }, { label: 'Incorrect', width: 70, align: 'right' }, { label: 'Skipped', width: 70, align: 'right' }, { label: 'Score', width: 130, align: 'right' }], d.sectionScores.map((s) => [s.name, String(s.correct), String(s.incorrect), String(s.unattempted), `${s.obtained} / ${s.total}`]));
    sectionTitle(doc, 'Integrity summary');
    keyValues(doc, [['Proctoring violations', String(d.violations)], ['Risk score', String(risk)]]);
    finish(doc, `${d.student} · ${d.exam}`);
});
export const reportRouter = Router();
reportRouter.use(adminOnly);
reportRouter.get('/schedules/:id/results.pdf', async (req, res) => {
    const s = await prisma.examSchedule.findUnique({ where: { id: req.params.id }, include: { assessment: true } });
    if (!s)
        throw notFound('Examination not found');
    const merit = await meritFor(s.id);
    const assigned = await prisma.examAssignment.count({ where: { scheduleId: s.id } });
    const passed = merit.filter((m) => m.passed).length;
    const avg = merit.length ? merit.reduce((a, m) => a + m.percentage, 0) / merit.length : 0;
    const doc = newDoc(res, `consolidated-${s.id.slice(0, 8)}`, `Consolidated results — ${s.name}`);
    header(doc, 'CONSOLIDATED RESULT SHEET', s.name);
    sectionTitle(doc, 'Examination details');
    keyValues(doc, [['Assessment', s.assessment.name], ['Examination', s.name], ['Window', `${fmtDt(s.startAt)} → ${fmtDt(s.endAt)}`], ['Duration', `${s.durationMin} minutes`], ['Pass mark', `${s.passPercent ?? s.assessment.passPercent}%`], ['Negative marking', s.assessment.negativeMarking ? 'Yes' : 'No']]);
    sectionTitle(doc, 'Summary');
    statCards(doc, [
        { label: 'Joined', value: String(assigned) }, { label: 'Wrote', value: String(merit.length), accent: true },
        { label: 'Passed', value: `${passed}` }, { label: 'Pass rate', value: merit.length ? `${Math.round((passed / merit.length) * 100)}%` : '—' }, { label: 'Average', value: `${avg.toFixed(1)}%` },
    ]);
    sectionTitle(doc, 'Merit list');
    table(doc, [{ label: 'Rank', width: 34 }, { label: 'Candidate', width: 130 }, { label: 'Mobile', width: 80 }, { label: 'Set', width: 28, align: 'center' }, { label: 'Marks', width: 70, align: 'right' }, { label: '%', width: 45, align: 'right' }, { label: 'Time', width: 60, align: 'right' }, { label: 'Result', width: 68, align: 'center' }], merit.map((m) => [String(m.rank), m.student, m.mobile, m.set, `${m.obtainedMarks}/${m.totalMarks}`, m.percentage.toFixed(1), fmtDur(m.timeTakenSec), m.passed ? 'PASS' : 'FAIL']));
    await audit(req, 'EXPORT_CONSOLIDATED_PDF', 'ExamSchedule', s.id);
    finish(doc, `${s.name} · Consolidated results`);
});
