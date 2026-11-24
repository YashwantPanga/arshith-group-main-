import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { adminOnly } from '../middleware/auth.js';
import { badRequest, conflict, notFound } from '../lib/errors.js';
import { audit } from '../lib/audit.js';
import { forget } from '../lib/cache.js';
import { defaultProctoring, proctoringSchema } from '../lib/proctoring.js';
export const assessmentsRouter = Router();
assessmentsRouter.use(adminOnly);
// any change to papers drops the cached copies the exam engine serves to students
assessmentsRouter.use((req, _res, next) => { if (req.method !== 'GET') {
    forget('paper:');
    forget('sections');
} next(); });
const SET_CODES = ['A', 'B', 'C'];
const LABELS = ['A', 'B', 'C', 'D'];
const sectionInput = z.object({
    categoryId: z.string().uuid(),
    questionCount: z.coerce.number().int().min(1, 'Each section needs at least 1 question').max(200),
    marksPerQuestion: z.coerce.number().positive('Marks must be greater than 0').max(100),
    negativeMarks: z.coerce.number().min(0).max(100),
});
const assessmentInput = z.object({
    name: z.string().trim().min(3, 'Name must be at least 3 characters').max(120),
    description: z.string().trim().max(2000).optional().nullable(),
    durationMin: z.coerce.number().int().min(1, 'Duration must be at least 1 minute').max(600),
    passPercent: z.coerce.number().min(0).max(100),
    negativeMarking: z.boolean(),
    shuffleQuestions: z.boolean(),
    shuffleOptions: z.boolean(),
    proctoring: proctoringSchema.default({}),
    sections: z.array(sectionInput).min(1, 'Add at least one section').max(8)
        .refine((s) => new Set(s.map((x) => x.categoryId)).size === s.length, 'Each category can only be used once'),
});
async function hasAttempts(assessmentId) {
    return (await prisma.examAttempt.count({ where: { schedule: { assessmentId } } })) > 0;
}
async function loadAssessment(id) {
    const a = await prisma.assessment.findUnique({
        where: { id },
        include: {
            sections: { include: { category: true }, orderBy: { position: 'asc' } },
            sets: { orderBy: { code: 'asc' }, include: { questions: { select: { sectionId: true } } } },
            _count: { select: { schedules: true } },
        },
    });
    if (!a)
        throw notFound('Assessment not found');
    return a;
}
function shape(a) {
    const totalQuestions = a.sections.reduce((s, x) => s + x.questionCount, 0);
    const totalMarks = a.sections.reduce((s, x) => s + x.questionCount * x.marksPerQuestion, 0);
    return {
        id: a.id, name: a.name, description: a.description, durationMin: a.durationMin, passPercent: a.passPercent, negativeMarking: a.negativeMarking,
        shuffleQuestions: a.shuffleQuestions, shuffleOptions: a.shuffleOptions, proctoring: { ...defaultProctoring(), ...a.proctoring },
        status: a.status, createdAt: a.createdAt, schedules: a._count.schedules, totalQuestions, totalMarks: Math.round(totalMarks * 100) / 100,
        sections: a.sections.map((s) => ({ id: s.id, categoryId: s.categoryId, category: s.category.name, categoryCode: s.category.code, questionCount: s.questionCount, marksPerQuestion: s.marksPerQuestion, negativeMarks: s.negativeMarks })),
        sets: a.sets.map((st) => {
            const bySection = Object.fromEntries(a.sections.map((s) => [s.id, st.questions.filter((q) => q.sectionId === s.id).length]));
            const complete = a.sections.every((s) => bySection[s.id] === s.questionCount);
            return { id: st.id, code: st.code, questions: st.questions.length, complete, bySection };
        }),
    };
}
assessmentsRouter.get('/', async (req, res) => {
    const status = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional().parse(req.query.status);
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const rows = await prisma.assessment.findMany({
        where: { ...(status ? { status } : {}), ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}) },
        orderBy: { createdAt: 'desc' },
        include: {
            sections: { include: { category: true }, orderBy: { position: 'asc' } },
            sets: { orderBy: { code: 'asc' }, include: { questions: { select: { sectionId: true } } } },
            _count: { select: { schedules: true } },
        },
    });
    res.json(rows.map(shape));
});
assessmentsRouter.post('/', async (req, res) => {
    const d = assessmentInput.parse(req.body);
    const a = await prisma.assessment.create({
        data: {
            name: d.name, description: d.description || null, durationMin: d.durationMin, passPercent: d.passPercent, negativeMarking: d.negativeMarking,
            shuffleQuestions: d.shuffleQuestions, shuffleOptions: d.shuffleOptions, proctoring: d.proctoring, createdById: req.user.id,
            sections: { create: d.sections.map((s, i) => ({ ...s, position: i })) },
            sets: { create: SET_CODES.map((code) => ({ code })) },
        },
    });
    await audit(req, 'CREATE_ASSESSMENT', 'Assessment', a.id, { name: a.name });
    res.status(201).json(shape(await loadAssessment(a.id)));
});
assessmentsRouter.get('/:id', async (req, res) => res.json(shape(await loadAssessment(req.params.id))));
assessmentsRouter.put('/:id', async (req, res) => {
    const d = assessmentInput.parse(req.body);
    const cur = await loadAssessment(req.params.id);
    const attempted = await hasAttempts(cur.id);
    const curSections = new Map(cur.sections.map((s) => [s.categoryId, s]));
    const structureChanged = d.sections.length !== cur.sections.length ||
        d.sections.some((s) => { const c = curSections.get(s.categoryId); return !c || c.questionCount !== s.questionCount || c.marksPerQuestion !== s.marksPerQuestion || c.negativeMarks !== s.negativeMarks; }) ||
        d.negativeMarking !== cur.negativeMarking || d.passPercent !== cur.passPercent;
    if (attempted && (structureChanged || d.durationMin !== cur.durationMin)) {
        throw conflict('Students have already attempted examinations from this assessment. Sections, marks, duration and pass mark are locked; duplicate the assessment to change them.', 'ASSESSMENT_LOCKED');
    }
    await prisma.$transaction(async (tx) => {
        await tx.assessment.update({
            where: { id: cur.id },
            data: { name: d.name, description: d.description || null, durationMin: d.durationMin, passPercent: d.passPercent, negativeMarking: d.negativeMarking, shuffleQuestions: d.shuffleQuestions, shuffleOptions: d.shuffleOptions, proctoring: d.proctoring },
        });
        const keep = d.sections.map((s) => s.categoryId);
        await tx.assessmentSection.deleteMany({ where: { assessmentId: cur.id, categoryId: { notIn: keep } } });
        for (const [i, s] of d.sections.entries()) {
            const sec = await tx.assessmentSection.upsert({
                where: { assessmentId_categoryId: { assessmentId: cur.id, categoryId: s.categoryId } },
                update: { questionCount: s.questionCount, marksPerQuestion: s.marksPerQuestion, negativeMarks: s.negativeMarks, position: i },
                create: { assessmentId: cur.id, ...s, position: i },
            });
            // keep snapshot marks in sync with the section configuration
            await tx.assessmentQuestion.updateMany({ where: { sectionId: sec.id }, data: { marks: s.marksPerQuestion, negativeMarks: s.negativeMarks } });
            // trim surplus questions if the section got smaller
            const surplus = await tx.assessmentQuestion.findMany({ where: { sectionId: sec.id }, orderBy: [{ paperSetId: 'asc' }, { position: 'asc' }] });
            const perSet = new Map();
            for (const q of surplus)
                perSet.set(q.paperSetId, [...(perSet.get(q.paperSetId) ?? []), q.id]);
            for (const ids of perSet.values())
                if (ids.length > s.questionCount)
                    await tx.assessmentQuestion.deleteMany({ where: { id: { in: ids.slice(s.questionCount) } } });
        }
        if (cur.status === 'PUBLISHED')
            await tx.assessment.update({ where: { id: cur.id }, data: { status: 'DRAFT' } });
    });
    await audit(req, 'UPDATE_ASSESSMENT', 'Assessment', cur.id);
    res.json(shape(await loadAssessment(cur.id)));
});
assessmentsRouter.delete('/:id', async (req, res) => {
    const a = await loadAssessment(req.params.id);
    if (a._count.schedules)
        throw conflict('This assessment has scheduled examinations. Delete or archive it instead.', 'IN_USE');
    await prisma.assessment.delete({ where: { id: a.id } });
    await audit(req, 'DELETE_ASSESSMENT', 'Assessment', a.id, { name: a.name });
    res.json({ ok: true });
});
assessmentsRouter.post('/:id/archive', async (req, res) => {
    const { archived } = z.object({ archived: z.boolean() }).parse(req.body);
    await prisma.assessment.update({ where: { id: req.params.id }, data: { status: archived ? 'ARCHIVED' : 'DRAFT' } });
    await audit(req, archived ? 'ARCHIVE_ASSESSMENT' : 'UNARCHIVE_ASSESSMENT', 'Assessment', req.params.id);
    res.json({ ok: true });
});
assessmentsRouter.post('/:id/duplicate', async (req, res) => {
    const src = await prisma.assessment.findUnique({ where: { id: req.params.id }, include: { sections: true, sets: { include: { questions: true } } } });
    if (!src)
        throw notFound('Assessment not found');
    const copy = await prisma.$transaction(async (tx) => {
        const a = await tx.assessment.create({
            data: { name: `${src.name} (copy)`, description: src.description, durationMin: src.durationMin, passPercent: src.passPercent, negativeMarking: src.negativeMarking, shuffleQuestions: src.shuffleQuestions, shuffleOptions: src.shuffleOptions, proctoring: src.proctoring, createdById: req.user.id },
        });
        const secMap = new Map();
        for (const s of src.sections)
            secMap.set(s.id, (await tx.assessmentSection.create({ data: { assessmentId: a.id, categoryId: s.categoryId, questionCount: s.questionCount, marksPerQuestion: s.marksPerQuestion, negativeMarks: s.negativeMarks, position: s.position } })).id);
        for (const st of src.sets) {
            const ns = await tx.paperSet.create({ data: { assessmentId: a.id, code: st.code } });
            if (st.questions.length)
                await tx.assessmentQuestion.createMany({ data: st.questions.map((q) => ({ paperSetId: ns.id, questionId: q.questionId, sectionId: secMap.get(q.sectionId), position: q.position, marks: q.marks, negativeMarks: q.negativeMarks })) });
        }
        return a;
    });
    await audit(req, 'DUPLICATE_ASSESSMENT', 'Assessment', copy.id, { from: src.id });
    res.status(201).json(shape(await loadAssessment(copy.id)));
});
/* ------------- paper sets ------------- */
async function getSet(assessmentId, code) {
    const set = await prisma.paperSet.findUnique({ where: { assessmentId_code: { assessmentId, code: code.toUpperCase() } } });
    if (!set)
        throw notFound('Paper set not found');
    return set;
}
async function setPayload(setId) {
    const rows = await prisma.assessmentQuestion.findMany({
        where: { paperSetId: setId }, orderBy: { position: 'asc' },
        include: { question: { include: { options: true, category: true } }, section: true },
    });
    return rows.map((r) => ({
        id: r.questionId, sectionId: r.sectionId, position: r.position, marks: r.marks, negativeMarks: r.negativeMarks,
        category: r.question.category.name, topic: r.question.topic, difficulty: r.question.difficulty, text: r.question.text, explanation: r.question.explanation,
        options: [...r.question.options].sort((a, b) => a.position - b.position).map((o) => ({ label: LABELS[o.position], text: o.text, isCorrect: o.isCorrect })),
    }));
}
assessmentsRouter.get('/:id/sets/:code', async (req, res) => {
    const set = await getSet(req.params.id, req.params.code);
    res.json({ code: set.code, questions: await setPayload(set.id) });
});
async function writeSet(assessmentId, setId, questionIds) {
    const sections = await prisma.assessmentSection.findMany({ where: { assessmentId }, orderBy: { position: 'asc' } });
    const bySection = new Map(sections.map((s) => [s.categoryId, s]));
    const qs = await prisma.question.findMany({ where: { id: { in: questionIds } }, select: { id: true, categoryId: true, status: true } });
    if (qs.length !== new Set(questionIds).size)
        throw badRequest('Some selected questions no longer exist');
    const qMap = new Map(qs.map((q) => [q.id, q]));
    const counts = new Map();
    const rows = [];
    let pos = 0;
    // order: by section order, preserving the caller's order inside a section
    for (const sec of sections) {
        for (const qid of questionIds) {
            const q = qMap.get(qid);
            if (q.categoryId !== sec.categoryId)
                continue;
            if (q.status !== 'PUBLISHED')
                throw badRequest('Draft questions cannot be added to a paper. Publish them first.');
            const n = (counts.get(sec.id) ?? 0) + 1;
            if (n > sec.questionCount)
                throw badRequest(`Section limit exceeded: only ${sec.questionCount} question(s) allowed in this section`);
            counts.set(sec.id, n);
            rows.push({ paperSetId: setId, questionId: qid, sectionId: sec.id, position: pos++, marks: sec.marksPerQuestion, negativeMarks: sec.negativeMarks });
        }
    }
    if (rows.length !== questionIds.length)
        throw badRequest('Some questions belong to categories that are not sections of this assessment');
    await prisma.$transaction([prisma.assessmentQuestion.deleteMany({ where: { paperSetId: setId } }), prisma.assessmentQuestion.createMany({ data: rows })]);
    return rows.length;
}
async function guardEditable(assessmentId) {
    if (await hasAttempts(assessmentId))
        throw conflict('This assessment already has attempts; its papers are locked.', 'ASSESSMENT_LOCKED');
}
assessmentsRouter.put('/:id/sets/:code/questions', async (req, res) => {
    const { questionIds } = z.object({ questionIds: z.array(z.string().uuid()).max(500) }).parse(req.body);
    await guardEditable(req.params.id);
    const set = await getSet(req.params.id, req.params.code);
    const n = await writeSet(req.params.id, set.id, questionIds);
    await prisma.assessment.updateMany({ where: { id: req.params.id, status: 'PUBLISHED' }, data: { status: 'DRAFT' } });
    await audit(req, 'UPDATE_PAPER_SET', 'Assessment', req.params.id, { set: set.code, questions: n });
    res.json({ questions: n });
});
/** Random paper generation honouring section sizes and an optional difficulty mix. */
assessmentsRouter.post('/:id/sets/:code/generate', async (req, res) => {
    const opts = z.object({
        avoidOtherSets: z.boolean().default(true),
        difficulty: z.object({ EASY: z.number().min(0), MEDIUM: z.number().min(0), HARD: z.number().min(0) }).default({ EASY: 30, MEDIUM: 50, HARD: 20 }),
    }).parse(req.body ?? {});
    await guardEditable(req.params.id);
    const a = await loadAssessment(req.params.id);
    const set = await getSet(a.id, req.params.code);
    const otherUsed = opts.avoidOtherSets
        ? new Set((await prisma.assessmentQuestion.findMany({ where: { paperSet: { assessmentId: a.id, id: { not: set.id } } }, select: { questionId: true } })).map((x) => x.questionId))
        : new Set();
    const picked = [];
    const shortages = [];
    const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    } return arr; };
    for (const sec of a.sections) {
        const pool = await prisma.question.findMany({ where: { categoryId: sec.categoryId, status: 'PUBLISHED' }, select: { id: true, difficulty: true, topic: true, subtopic: true } });
        const fresh = shuffle(pool.filter((q) => !otherUsed.has(q.id)));
        const used = shuffle(pool.filter((q) => otherUsed.has(q.id)));
        const wsum = opts.difficulty.EASY + opts.difficulty.MEDIUM + opts.difficulty.HARD || 1;
        const nE = Math.round((sec.questionCount * opts.difficulty.EASY) / wsum), nH = Math.round((sec.questionCount * opts.difficulty.HARD) / wsum);
        const targets = shuffle([...Array(nE).fill('EASY'), ...Array(Math.max(0, sec.questionCount - nE - nH)).fill('MEDIUM'), ...Array(nH).fill('HARD')]);
        // Balanced paper: every pick takes the least-used topic (then sub-topic) so a 20-question section covers the syllabus
        // evenly instead of repeating one topic, while still following the easy / medium / hard mix.
        const topicUse = new Map();
        const subUse = new Map();
        const chosen = [];
        const taken = new Set();
        const pickFrom = (list, diff) => {
            let best = null;
            let bestScore = Infinity;
            for (const q of list) {
                if (taken.has(q.id) || (diff && q.difficulty !== diff))
                    continue;
                const score = (topicUse.get(q.topic) ?? 0) * 10 + (subUse.get(`${q.topic}|${q.subtopic ?? ''}`) ?? 0);
                if (score < bestScore) {
                    best = q;
                    bestScore = score;
                    if (score === 0)
                        break;
                }
            }
            return best;
        };
        for (const diff of targets) {
            const q = pickFrom(fresh, diff) ?? pickFrom(fresh, null) ?? pickFrom(used, diff) ?? pickFrom(used, null);
            if (!q)
                break;
            taken.add(q.id);
            chosen.push(q.id);
            topicUse.set(q.topic, (topicUse.get(q.topic) ?? 0) + 1);
            const k = `${q.topic}|${q.subtopic ?? ''}`;
            subUse.set(k, (subUse.get(k) ?? 0) + 1);
        }
        if (chosen.length < sec.questionCount)
            shortages.push(`${sec.category.name}: need ${sec.questionCount}, only ${chosen.length} published questions available`);
        picked.push(...chosen);
    }
    const n = await writeSet(a.id, set.id, picked);
    await prisma.assessment.updateMany({ where: { id: a.id, status: 'PUBLISHED' }, data: { status: 'DRAFT' } });
    await audit(req, 'GENERATE_PAPER_SET', 'Assessment', a.id, { set: set.code, questions: n });
    res.json({ questions: n, warnings: shortages });
});
assessmentsRouter.delete('/:id/sets/:code/questions', async (req, res) => {
    await guardEditable(req.params.id);
    const set = await getSet(req.params.id, req.params.code);
    await prisma.assessmentQuestion.deleteMany({ where: { paperSetId: set.id } });
    await prisma.assessment.updateMany({ where: { id: req.params.id, status: 'PUBLISHED' }, data: { status: 'DRAFT' } });
    res.json({ ok: true });
});
assessmentsRouter.post('/:id/publish', async (req, res) => {
    const a = shape(await loadAssessment(req.params.id));
    if (!a.sets.some((s) => s.complete)) {
        const need = a.sections.map((s) => `${s.category} ${s.questionCount}`).join(', ');
        const have = a.sets.map((s) => `Set ${s.code}: ${s.questions}/${a.sections.reduce((n, x) => n + x.questionCount, 0)}`).join(' · ');
        throw badRequest(`No paper set is complete yet (${have}). Open a set and use "Auto-fill" so each section is full (${need}), then publish.`, 'INCOMPLETE');
    }
    await prisma.assessment.update({ where: { id: a.id }, data: { status: 'PUBLISHED' } });
    await audit(req, 'PUBLISH_ASSESSMENT', 'Assessment', a.id);
    res.json({ ok: true, readySets: a.sets.filter((s) => s.complete).map((s) => s.code) });
});
assessmentsRouter.post('/:id/unpublish', async (req, res) => {
    const active = await prisma.examSchedule.count({ where: { assessmentId: req.params.id, status: { in: ['PUBLISHED', 'PAUSED'] }, endAt: { gt: new Date() } } });
    if (active)
        throw conflict('There are live or upcoming published examinations for this assessment. Cancel them first.', 'IN_USE');
    await prisma.assessment.update({ where: { id: req.params.id }, data: { status: 'DRAFT' } });
    await audit(req, 'UNPUBLISH_ASSESSMENT', 'Assessment', req.params.id);
    res.json({ ok: true });
});
