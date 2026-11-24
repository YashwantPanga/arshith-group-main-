import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { Difficulty } from '@prisma/client';
import { prisma } from '../db.js';
import { adminOnly } from '../middleware/auth.js';
import { badRequest, conflict, notFound } from '../lib/errors.js';
import { audit } from '../lib/audit.js';
import { buildWorkbook, parseSheet, sendWorkbook } from '../lib/excel.js';
import { runPython } from '../lib/codeRunner.js';
export const questionsRouter = Router();
questionsRouter.use(adminOnly);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const LABELS = ['A', 'B', 'C', 'D'];
const questionInput = z.object({
    categoryId: z.string().uuid('Select a category'),
    topic: z.string().trim().min(2, 'Topic is required').max(80),
    subtopic: z.string().trim().max(80).optional().nullable(),
    text: z.string().trim().min(5, 'Question text is required').max(4000),
    options: z.array(z.object({ text: z.string().trim().min(1, 'Option text is required').max(500) })).length(4, 'Provide exactly four options'),
    correctIndex: z.number().int().min(0).max(3),
    explanation: z.string().trim().max(3000).optional().nullable(),
    difficulty: z.nativeEnum(Difficulty).default('MEDIUM'),
    marks: z.coerce.number().positive('Marks must be greater than 0').max(100).default(1),
    negativeMarks: z.coerce.number().min(0, 'Negative marks cannot be below 0').max(100).default(0.25),
    status: z.enum(['DRAFT', 'PUBLISHED']).default('PUBLISHED'),
}).superRefine((v, ctx) => {
    const set = new Set(v.options.map((o) => o.text.toLowerCase()));
    if (set.size !== 4)
        ctx.addIssue({ code: 'custom', path: ['options'], message: 'Options must be distinct' });
});
const ident = z.string().trim().regex(/^[A-Za-z_][A-Za-z0-9_]*$/, 'Use a valid Python function name');
const codingInput = z.object({
    type: z.literal('CODING'),
    categoryId: z.string().uuid('Select a category'),
    topic: z.string().trim().min(2, 'Topic is required').max(80),
    subtopic: z.string().trim().max(80).optional().nullable(),
    title: z.string().trim().min(3, 'Title is required').max(120),
    text: z.string().trim().min(10, 'Describe the problem').max(6000),
    funcName: ident,
    paramNames: z.array(ident).max(8),
    starterCode: z.string().min(5, 'Provide starter code').max(5000),
    solution: z.string().max(10000).optional().nullable(),
    constraints: z.array(z.string().trim().min(1).max(200)).max(10).default([]),
    testCases: z.array(z.object({ args: z.array(z.unknown()), expected: z.unknown(), isHidden: z.boolean().default(false), hint: z.string().trim().max(200).optional().nullable() })).min(2, 'Add at least 2 test cases').max(40),
    explanation: z.string().trim().max(3000).optional().nullable(),
    difficulty: z.nativeEnum(Difficulty).default('MEDIUM'),
    marks: z.coerce.number().positive('Marks must be greater than 0').max(100).default(20),
    negativeMarks: z.coerce.number().min(0).max(100).default(0),
    status: z.enum(['DRAFT', 'PUBLISHED']).default('PUBLISHED'),
}).superRefine((v, ctx) => {
    if (!v.testCases.some((t) => !t.isHidden))
        ctx.addIssue({ code: 'custom', path: ['testCases'], message: 'At least one test case must be visible (it is shown as an example)' });
    if (!v.testCases.some((t) => t.isHidden))
        ctx.addIssue({ code: 'custom', path: ['testCases'], message: 'Add at least one hidden test case' });
    v.testCases.forEach((t, i) => { if (t.args.length !== v.paramNames.length)
        ctx.addIssue({ code: 'custom', path: ['testCases', i], message: `Case ${i + 1}: expected ${v.paramNames.length} argument(s)` }); });
});
const qInclude = { options: true, category: true, testCases: { orderBy: { position: 'asc' } } };
export const questionShape = (q) => ({
    id: q.id, categoryId: q.categoryId, category: q.category.name, categoryCode: q.category.code, topic: q.topic, subtopic: q.subtopic,
    text: q.text, explanation: q.explanation, difficulty: q.difficulty, marks: q.marks, negativeMarks: q.negativeMarks, status: q.status,
    options: [...q.options].sort((a, b) => a.position - b.position).map((o) => ({ id: o.id, label: LABELS[o.position], text: o.text, isCorrect: o.isCorrect })),
    correctIndex: q.options.find((o) => o.isCorrect)?.position ?? -1, createdAt: q.createdAt,
    type: q.type, title: q.title, funcName: q.funcName, paramNames: q.paramNames ?? [], starterCode: q.starterCode, solution: q.solution, constraints: q.constraints ?? [],
    testCases: [...q.testCases].sort((a, b) => a.position - b.position).map((t) => ({ args: t.args, expected: t.expected, isHidden: t.isHidden, hint: t.hint })),
});
/** A question is locked once an examination that used it has attempts: its options can no longer change. */
async function isLocked(questionId) {
    return (await prisma.examAttempt.count({ where: { paperSet: { questions: { some: { questionId } } } } })) > 0;
}
questionsRouter.get('/categories', async (_req, res) => {
    const cats = await prisma.questionCategory.findMany({ orderBy: { position: 'asc' }, include: { _count: { select: { questions: true } } } });
    res.json(cats.map((c) => ({ id: c.id, code: c.code, name: c.name, count: c._count.questions })));
});
questionsRouter.get('/topics', async (req, res) => {
    const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;
    const rows = await prisma.question.groupBy({ by: ['topic'], where: categoryId ? { categoryId } : {}, _count: true, orderBy: { topic: 'asc' } });
    res.json(rows.map((r) => ({ topic: r.topic, count: r._count })));
});
questionsRouter.get('/template', async (req, res) => {
    const wb = buildWorkbook('Questions', [
        { header: 'category', key: 'category' }, { header: 'topic', key: 'topic' }, { header: 'subtopic', key: 'subtopic' },
        { header: 'question', key: 'question', width: 50 }, { header: 'optionA', key: 'a' }, { header: 'optionB', key: 'b' },
        { header: 'optionC', key: 'c' }, { header: 'optionD', key: 'd' }, { header: 'correct', key: 'correct', width: 10 },
        { header: 'explanation', key: 'explanation', width: 40 }, { header: 'difficulty', key: 'difficulty', width: 12 },
        { header: 'marks', key: 'marks', width: 8 }, { header: 'negativeMarks', key: 'neg', width: 14 },
    ], [{ category: 'QUANT', topic: 'Time & Distance', subtopic: 'Trains', question: 'A train 240 m long passes a pole in 12 s. How long to cross a 360 m platform?', a: '24 s', b: '30 s', c: '36 s', d: '42 s', correct: 'B', explanation: 'Speed = 20 m/s; distance = 600 m; time = 30 s.', difficulty: 'MEDIUM', marks: 1, neg: 0.25 }]);
    await sendWorkbook(res, wb, 'question-import-template', req.query.format === 'csv' ? 'csv' : 'xlsx');
});
questionsRouter.get('/', async (req, res) => {
    const q = z.object({
        search: z.string().optional(), categoryId: z.string().optional(), difficulty: z.nativeEnum(Difficulty).optional(), topic: z.string().optional(),
        status: z.enum(['DRAFT', 'PUBLISHED']).optional(), type: z.enum(['MCQ', 'CODING']).optional(), page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(200).default(20),
        excludeSetOf: z.string().optional(),
    }).parse(req.query);
    const where = {
        ...(q.categoryId ? { categoryId: q.categoryId } : {}), ...(q.difficulty ? { difficulty: q.difficulty } : {}),
        ...(q.topic ? { topic: q.topic } : {}), ...(q.status ? { status: q.status } : {}), ...(q.type ? { type: q.type } : {}),
        ...(q.search ? { OR: [{ text: { contains: q.search, mode: 'insensitive' } }, { title: { contains: q.search, mode: 'insensitive' } }, { topic: { contains: q.search, mode: 'insensitive' } }, { subtopic: { contains: q.search, mode: 'insensitive' } }] } : {}),
    };
    const [total, rows] = await Promise.all([
        prisma.question.count({ where }),
        prisma.question.findMany({ where, include: qInclude, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    ]);
    res.json({ total, page: q.page, pageSize: q.pageSize, items: rows.map(questionShape) });
});
questionsRouter.get('/:id', async (req, res) => {
    const q = await prisma.question.findUnique({ where: { id: req.params.id }, include: qInclude });
    if (!q)
        throw notFound('Question not found');
    res.json({ ...questionShape(q), locked: await isLocked(q.id) });
});
const codingData = (d) => ({
    categoryId: d.categoryId, topic: d.topic, subtopic: d.subtopic || null, text: d.text, title: d.title, explanation: d.explanation || null, difficulty: d.difficulty, marks: d.marks, negativeMarks: d.negativeMarks, status: d.status,
    type: 'CODING', funcName: d.funcName, paramNames: d.paramNames, starterCode: d.starterCode, solution: d.solution || null, constraints: d.constraints,
});
const caseRows = (d) => d.testCases.map((t, i) => ({ position: i, args: t.args, expected: (t.expected ?? null), isHidden: t.isHidden, hint: t.hint || null }));
/** Runs the reference solution against the cases so the author can verify the test data before publishing. */
questionsRouter.post('/validate-code', async (req, res) => {
    const d = z.object({ funcName: ident, code: z.string().min(5).max(10000), testCases: z.array(z.object({ args: z.array(z.unknown()), expected: z.unknown().optional() })).min(1).max(40), generate: z.boolean().optional() }).parse(req.body);
    // generate=true: just run the solution and report what it returns (used to fill in expected outputs)
    const results = await runPython(d.code, d.funcName, d.testCases.map((t) => ({ args: t.args, expected: t.expected, hasExpected: !d.generate })));
    res.json({ passed: results.filter((r) => r.ok).length, total: results.length, results });
});
questionsRouter.post('/', async (req, res) => {
    if (req.body?.type === 'CODING') {
        const c = codingInput.parse(req.body);
        const q = await prisma.question.create({ data: { ...codingData(c), testCases: { create: caseRows(c) } }, include: qInclude });
        await audit(req, 'CREATE_QUESTION', 'Question', q.id, { type: 'CODING' });
        res.status(201).json(questionShape(q));
        return;
    }
    const d = questionInput.parse(req.body);
    const q = await prisma.question.create({
        data: {
            categoryId: d.categoryId, topic: d.topic, subtopic: d.subtopic || null, text: d.text, explanation: d.explanation || null,
            difficulty: d.difficulty, marks: d.marks, negativeMarks: d.negativeMarks, status: d.status,
            options: { create: d.options.map((o, i) => ({ position: i, text: o.text, isCorrect: i === d.correctIndex })) },
        },
        include: qInclude,
    });
    await audit(req, 'CREATE_QUESTION', 'Question', q.id);
    res.status(201).json(questionShape(q));
});
questionsRouter.put('/:id', async (req, res) => {
    if (req.body?.type === 'CODING') {
        const c = codingInput.parse(req.body);
        const cur = await prisma.question.findUnique({ where: { id: req.params.id } });
        if (!cur || cur.type !== 'CODING')
            throw notFound('Coding question not found');
        if (await isLocked(cur.id))
            throw conflict('This problem was used in an examination that already has attempts, so it can no longer be edited.', 'QUESTION_LOCKED');
        const q = await prisma.$transaction(async (tx) => {
            await tx.questionTestCase.deleteMany({ where: { questionId: cur.id } });
            return tx.question.update({ where: { id: cur.id }, data: { ...codingData(c), testCases: { create: caseRows(c) } }, include: qInclude });
        });
        await audit(req, 'UPDATE_QUESTION', 'Question', q.id, { type: 'CODING' });
        res.json(questionShape(q));
        return;
    }
    const d = questionInput.parse(req.body);
    const existing = await prisma.question.findUnique({ where: { id: req.params.id }, include: { options: true } });
    if (!existing)
        throw notFound('Question not found');
    const locked = await isLocked(existing.id);
    const sorted = [...existing.options].sort((a, b) => a.position - b.position);
    if (locked && sorted.findIndex((o) => o.isCorrect) !== d.correctIndex) {
        throw conflict('This question was used in an examination that already has attempts, so its correct answer cannot be changed.', 'QUESTION_LOCKED');
    }
    const q = await prisma.$transaction(async (tx) => {
        // Update options in place (ids are referenced by student answers) – clear the correct flag first to respect the unique index.
        await tx.questionOption.updateMany({ where: { questionId: existing.id }, data: { isCorrect: false } });
        for (let i = 0; i < 4; i++) {
            await tx.questionOption.update({ where: { id: sorted[i].id }, data: { text: d.options[i].text, isCorrect: i === d.correctIndex } });
        }
        return tx.question.update({
            where: { id: existing.id },
            data: { categoryId: d.categoryId, topic: d.topic, subtopic: d.subtopic || null, text: d.text, explanation: d.explanation || null, difficulty: d.difficulty, marks: d.marks, negativeMarks: d.negativeMarks, status: d.status },
            include: qInclude,
        });
    });
    await audit(req, 'UPDATE_QUESTION', 'Question', q.id);
    res.json(questionShape(q));
});
async function assertDeletable(ids) {
    const used = await prisma.assessmentQuestion.findMany({ where: { questionId: { in: ids } }, select: { questionId: true }, distinct: ['questionId'] });
    if (used.length)
        throw conflict(`${used.length} selected question(s) are used in assessment papers. Remove them from the papers first, or mark them as Draft.`, 'IN_USE');
}
questionsRouter.delete('/:id', async (req, res) => {
    await assertDeletable([req.params.id]);
    await prisma.question.delete({ where: { id: req.params.id } });
    await audit(req, 'DELETE_QUESTION', 'Question', req.params.id);
    res.json({ ok: true });
});
questionsRouter.post('/bulk-delete', async (req, res) => {
    const { ids } = z.object({ ids: z.array(z.string().uuid()).min(1).max(500) }).parse(req.body);
    await assertDeletable(ids);
    const r = await prisma.question.deleteMany({ where: { id: { in: ids } } });
    await audit(req, 'BULK_DELETE_QUESTIONS', 'Question', null, { count: r.count });
    res.json({ deleted: r.count });
});
questionsRouter.post('/bulk-status', async (req, res) => {
    const { ids, status } = z.object({ ids: z.array(z.string().uuid()).min(1).max(500), status: z.enum(['DRAFT', 'PUBLISHED']) }).parse(req.body);
    const r = await prisma.question.updateMany({ where: { id: { in: ids } }, data: { status } });
    await audit(req, 'BULK_QUESTION_STATUS', 'Question', null, { count: r.count, status });
    res.json({ updated: r.count });
});
const CATEGORY_ALIASES = {
    technical: 'TECHNICAL', tech: 'TECHNICAL', quant: 'QUANT', quantitative: 'QUANT', quantitativeaptitude: 'QUANT', aptitude: 'QUANT',
    logical: 'LOGICAL', logicalreasoning: 'LOGICAL', reasoning: 'LOGICAL', verbal: 'VERBAL', verbalability: 'VERBAL',
};
questionsRouter.post('/import', upload.single('file'), async (req, res) => {
    if (!req.file)
        throw badRequest('Attach a .csv or .xlsx file');
    const rows = await parseSheet(req.file);
    if (!rows.length)
        throw badRequest('The file has no data rows');
    if (rows.length > 5000)
        throw badRequest('Import at most 5000 rows at a time');
    const cats = await prisma.questionCategory.findMany();
    const byCode = new Map(cats.map((c) => [c.code, c.id]));
    const toCreate = [];
    const errors = [];
    rows.forEach((r, i) => {
        const code = CATEGORY_ALIASES[(r.category ?? '').toLowerCase().replace(/[^a-z]/g, '')];
        const letter = (r.correct ?? r.answer ?? '').trim().toUpperCase();
        const parsed = questionInput.safeParse({
            categoryId: code ? byCode.get(code) : undefined, topic: r.topic, subtopic: r.subtopic || null, text: r.question ?? r.text,
            options: [r.optiona, r.optionb, r.optionc, r.optiond].map((t) => ({ text: t ?? '' })),
            correctIndex: LABELS.indexOf(letter), explanation: r.explanation || null,
            difficulty: (r.difficulty || 'MEDIUM').toUpperCase(), marks: r.marks || 1, negativeMarks: r.negativemarks || 0.25, status: 'PUBLISHED',
        });
        if (!code)
            errors.push({ row: i + 2, message: 'category: use Technical, Quant, Logical or Verbal' });
        else if (letter && !LABELS.includes(letter))
            errors.push({ row: i + 2, message: 'correct: use A, B, C or D' });
        else if (!parsed.success)
            errors.push({ row: i + 2, message: parsed.error.issues.map((x) => `${x.path[0]}: ${x.message}`).join('; ') });
        else
            toCreate.push(parsed.data);
    });
    await prisma.$transaction(async (tx) => {
        for (const d of toCreate) {
            await tx.question.create({
                data: { categoryId: d.categoryId, topic: d.topic, subtopic: d.subtopic || null, text: d.text, explanation: d.explanation || null, difficulty: d.difficulty, marks: d.marks, negativeMarks: d.negativeMarks, status: d.status,
                    options: { create: d.options.map((o, i) => ({ position: i, text: o.text, isCorrect: i === d.correctIndex })) } },
            });
        }
    }, { timeout: 60000 });
    await audit(req, 'IMPORT_QUESTIONS', 'Question', null, { created: toCreate.length, failed: errors.length });
    res.json({ created: toCreate.length, failed: errors.length, errors });
});
