import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { adminOnly } from '../middleware/auth.js';
import { badRequest, conflict, notFound } from '../lib/errors.js';
import { generatePassword, hashPassword } from '../lib/password.js';
import { audit } from '../lib/audit.js';
import { notify } from '../lib/notify.js';
import { config } from '../config.js';
import { buildWorkbook, parseSheet, sendWorkbook } from '../lib/excel.js';
import { studentFields } from './auth.js';
export const studentsRouter = Router();
studentsRouter.use(adminOnly);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const studentInput = z.object({
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    ...studentFields,
    batchId: z.string().uuid().nullable().optional(),
});
async function createStudent(d, opts = {}) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: 'STUDENT' } });
    const password = generatePassword();
    const user = await prisma.user.create({
        data: {
            email: d.email,
            passwordHash: await hashPassword(password),
            roleId: role.id,
            emailVerified: true,
            student: { create: { fullName: d.fullName, mobile: d.mobile, college: d.college, regNo: d.regNo.toUpperCase(), branch: d.branch, graduationYear: d.graduationYear, batchId: opts.batchId ?? d.batchId ?? null } },
        },
    });
    void notify({
        userId: user.id, email: user.email, type: 'REGISTRATION', title: `Your ${config.ORG_NAME} account is ready`,
        body: `Hi ${d.fullName}, an account has been created for you. Sign in with your email or registration number (${d.regNo.toUpperCase()}). Temporary password: ${password} — please change it after signing in.`,
        cta: { label: 'Sign in', path: '/login' },
    });
    return { user, password };
}
const profileShape = (s) => ({
    id: s.userId, profileId: s.id, fullName: s.fullName, email: s.user.email, mobile: s.mobile, college: s.college, regNo: s.regNo,
    branch: s.branch, graduationYear: s.graduationYear, batchId: s.batchId, batch: s.batch?.name ?? null,
    isActive: s.user.isActive, emailVerified: s.user.emailVerified, lastLoginAt: s.user.lastLoginAt, createdAt: s.createdAt,
});
studentsRouter.get('/', async (req, res) => {
    const q = z.object({
        search: z.string().optional(), batchId: z.string().optional(), status: z.enum(['active', 'disabled']).optional(),
        page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(200).default(20),
    }).parse(req.query);
    const where = {
        ...(q.batchId === 'none' ? { batchId: null } : q.batchId ? { batchId: q.batchId } : {}),
        ...(q.status ? { user: { isActive: q.status === 'active' } } : {}),
        ...(q.search ? { OR: [
                { fullName: { contains: q.search, mode: 'insensitive' } }, { regNo: { contains: q.search, mode: 'insensitive' } },
                { college: { contains: q.search, mode: 'insensitive' } }, { mobile: { contains: q.search } }, { user: { email: { contains: q.search, mode: 'insensitive' } } },
            ] } : {}),
    };
    const [total, rows] = await Promise.all([
        prisma.studentProfile.count({ where }),
        prisma.studentProfile.findMany({ where, include: { user: true, batch: true }, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    ]);
    res.json({ total, page: q.page, pageSize: q.pageSize, items: rows.map(profileShape) });
});
studentsRouter.get('/template', async (req, res) => {
    const wb = buildWorkbook('Students', [
        { header: 'fullName', key: 'fullName', width: 24 }, { header: 'email', key: 'email', width: 28 }, { header: 'mobile', key: 'mobile' },
        { header: 'college', key: 'college', width: 28 }, { header: 'regNo', key: 'regNo' }, { header: 'branch', key: 'branch' },
        { header: 'graduationYear', key: 'graduationYear' }, { header: 'batch', key: 'batch' },
    ], [{ fullName: 'Rahul Kumar', email: 'rahul@example.com', mobile: '9876543210', college: 'ABC Institute of Technology', regNo: 'AB26-0417', branch: 'CSE', graduationYear: 2026, batch: 'CSE 2026' }]);
    await sendWorkbook(res, wb, 'student-import-template', req.query.format === 'csv' ? 'csv' : 'xlsx');
});
studentsRouter.post('/', async (req, res) => {
    const body = studentInput.parse(req.body);
    const { user } = await createStudent(body);
    await audit(req, 'CREATE_STUDENT', 'Student', user.id, { email: user.email });
    res.status(201).json({ id: user.id });
});
/** Bulk import from CSV/XLSX. Valid rows are created; invalid rows are reported with reasons. */
studentsRouter.post('/import', upload.single('file'), async (req, res) => {
    if (!req.file)
        throw badRequest('Attach a .csv or .xlsx file');
    const rows = await parseSheet(req.file);
    if (!rows.length)
        throw badRequest('The file has no data rows');
    if (rows.length > 2000)
        throw badRequest('Import at most 2000 rows at a time');
    const batchCache = new Map();
    const created = [];
    const errors = [];
    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const parsed = studentInput.omit({ batchId: true }).safeParse({
            fullName: r.fullname ?? r.name, email: r.email, mobile: (r.mobile ?? r.phone ?? '').replace(/[\s-]/g, ''), college: r.college ?? r.collegename,
            regNo: r.regno ?? r.registrationnumber, branch: r.branch, graduationYear: r.graduationyear ?? r.year,
        });
        if (!parsed.success) {
            errors.push({ row: i + 2, message: parsed.error.issues.map((x) => `${x.path[0]}: ${x.message}`).join('; ') });
            continue;
        }
        try {
            let batchId = null;
            const bn = (r.batch ?? r.batchname ?? '').trim();
            if (bn) {
                if (!batchCache.has(bn))
                    batchCache.set(bn, (await prisma.batch.upsert({ where: { name: bn }, update: {}, create: { name: bn } })).id);
                batchId = batchCache.get(bn);
            }
            const { password } = await createStudent(parsed.data, { batchId });
            created.push({ email: parsed.data.email, regNo: parsed.data.regNo.toUpperCase(), fullName: parsed.data.fullName, password });
        }
        catch (e) {
            const dup = e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
            errors.push({ row: i + 2, message: dup ? 'Email or registration number already exists' : e.message });
        }
    }
    await audit(req, 'IMPORT_STUDENTS', 'Student', null, { created: created.length, failed: errors.length });
    res.json({ created: created.length, failed: errors.length, errors, credentials: created });
});
studentsRouter.get('/:id', async (req, res) => {
    const s = await prisma.studentProfile.findUnique({ where: { userId: req.params.id }, include: { user: true, batch: true } });
    if (!s)
        throw notFound('Student not found');
    const [attempts, assignments] = await Promise.all([
        prisma.examAttempt.findMany({
            where: { studentId: s.userId }, orderBy: { startedAt: 'desc' },
            include: { schedule: { select: { id: true, name: true, assessment: { select: { name: true } } } }, paperSet: { select: { code: true } }, result: true },
        }),
        prisma.examAssignment.findMany({ where: { studentId: s.userId }, include: { schedule: { select: { id: true, name: true, startAt: true, endAt: true, status: true } } } }),
    ]);
    const attended = new Set(attempts.map((a) => a.scheduleId));
    res.json({
        ...profileShape(s),
        stats: { assigned: assignments.length, attended: attended.size, attendancePct: assignments.length ? Math.round((attended.size / assignments.length) * 100) : 0 },
        attempts: attempts.map((a) => ({
            id: a.id, schedule: a.schedule.name, assessment: a.schedule.assessment.name, set: a.paperSet.code, status: a.status, startedAt: a.startedAt, submittedAt: a.submittedAt,
            violations: a.violationCount, obtained: a.result?.obtainedMarks ?? null, total: a.result?.totalMarks ?? null, percentage: a.result?.percentage ?? null, passed: a.result?.passed ?? null,
        })),
        assignments: assignments.map((a) => ({ scheduleId: a.scheduleId, name: a.schedule.name, startAt: a.schedule.startAt, endAt: a.schedule.endAt, status: a.schedule.status })),
    });
});
studentsRouter.put('/:id', async (req, res) => {
    const body = studentInput.parse(req.body);
    const s = await prisma.studentProfile.findUnique({ where: { userId: req.params.id } });
    if (!s)
        throw notFound('Student not found');
    await prisma.$transaction([
        prisma.user.update({ where: { id: s.userId }, data: { email: body.email } }),
        prisma.studentProfile.update({ where: { id: s.id }, data: { fullName: body.fullName, mobile: body.mobile, college: body.college, regNo: body.regNo.toUpperCase(), branch: body.branch, graduationYear: body.graduationYear, batchId: body.batchId ?? null } }),
    ]);
    await audit(req, 'UPDATE_STUDENT', 'Student', s.userId);
    res.json({ ok: true });
});
studentsRouter.patch('/:id/status', async (req, res) => {
    const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
    const u = await prisma.user.findFirst({ where: { id: req.params.id, role: { name: 'STUDENT' } } });
    if (!u)
        throw notFound('Student not found');
    await prisma.user.update({ where: { id: u.id }, data: { isActive } });
    await audit(req, isActive ? 'ENABLE_STUDENT' : 'DISABLE_STUDENT', 'Student', u.id);
    res.json({ ok: true });
});
studentsRouter.post('/:id/reset-password', async (req, res) => {
    const s = await prisma.studentProfile.findUnique({ where: { userId: req.params.id }, include: { user: true } });
    if (!s)
        throw notFound('Student not found');
    const password = generatePassword();
    await prisma.user.update({ where: { id: s.userId }, data: { passwordHash: await hashPassword(password), failedLogins: 0, lockedUntil: null } });
    void notify({ userId: s.userId, email: s.user.email, type: 'PASSWORD_RESET', title: 'Your password was reset', body: `An administrator reset your password. Temporary password: ${password}`, cta: { label: 'Sign in', path: '/login' } });
    await audit(req, 'RESET_STUDENT_PASSWORD', 'Student', s.userId);
    res.json({ ok: true, password });
});
studentsRouter.delete('/:id', async (req, res) => {
    const u = await prisma.user.findFirst({ where: { id: req.params.id, role: { name: 'STUDENT' } }, include: { student: true } });
    if (!u)
        throw notFound('Student not found');
    if (await prisma.examAttempt.count({ where: { studentId: u.id } }))
        throw conflict('This student has examination attempts. Disable the account instead of deleting it.', 'HAS_ATTEMPTS');
    await prisma.user.delete({ where: { id: u.id } });
    await audit(req, 'DELETE_STUDENT', 'Student', u.id, { regNo: u.student?.regNo });
    res.json({ ok: true });
});
/* ---------------- Batches ---------------- */
export const batchesRouter = Router();
batchesRouter.use(adminOnly);
batchesRouter.get('/', async (_req, res) => {
    const batches = await prisma.batch.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { students: true } } } });
    res.json(batches.map((b) => ({ id: b.id, name: b.name, description: b.description, students: b._count.students })));
});
const batchInput = z.object({ name: z.string().trim().min(2, 'Batch name is required').max(80), description: z.string().trim().max(300).optional().nullable() });
batchesRouter.post('/', async (req, res) => {
    const b = await prisma.batch.create({ data: batchInput.parse(req.body) });
    await audit(req, 'CREATE_BATCH', 'Batch', b.id, { name: b.name });
    res.status(201).json(b);
});
batchesRouter.put('/:id', async (req, res) => {
    const b = await prisma.batch.update({ where: { id: req.params.id }, data: batchInput.parse(req.body) });
    await audit(req, 'UPDATE_BATCH', 'Batch', b.id);
    res.json(b);
});
batchesRouter.delete('/:id', async (req, res) => {
    await prisma.batch.delete({ where: { id: req.params.id } });
    await audit(req, 'DELETE_BATCH', 'Batch', req.params.id);
    res.json({ ok: true });
});
batchesRouter.post('/:id/students', async (req, res) => {
    const { studentIds } = z.object({ studentIds: z.array(z.string().uuid()).min(1, 'Select at least one student') }).parse(req.body);
    const r = await prisma.studentProfile.updateMany({ where: { userId: { in: studentIds } }, data: { batchId: req.params.id } });
    await audit(req, 'ASSIGN_BATCH', 'Batch', req.params.id, { count: r.count });
    res.json({ updated: r.count });
});
batchesRouter.delete('/:id/students', async (req, res) => {
    const { studentIds } = z.object({ studentIds: z.array(z.string().uuid()).min(1) }).parse(req.body);
    const r = await prisma.studentProfile.updateMany({ where: { userId: { in: studentIds }, batchId: req.params.id }, data: { batchId: null } });
    res.json({ updated: r.count });
});
