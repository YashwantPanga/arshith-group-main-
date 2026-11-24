import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { authenticate } from '../middleware/auth.js';
import { badRequest, forbidden, unauthorized } from '../lib/errors.js';
import { generateOtp, hashPassword, sha256, verifyPassword } from '../lib/password.js';
import { signToken } from '../lib/jwt.js';
import { renderEmail, sendMail } from '../lib/mailer.js';
import { notify } from '../lib/notify.js';
import { audit } from '../lib/audit.js';
export const authRouter = Router();
const tooMany = { error: { message: 'Too many attempts. Please try again later.', code: 'RATE_LIMITED' } };
// Only failures count (a campus lab can share one IP); per-account lockout handles targeted brute force.
authRouter.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 200, skipSuccessfulRequests: true, standardHeaders: true, legacyHeaders: false, message: tooMany }));
// Email-sending endpoints are limited per address so they cannot be used to spam inboxes.
const mailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false, message: tooMany,
    keyGenerator: (req) => `${String(req.body?.email ?? '').toLowerCase()}|${req.path}`, validate: false,
});
authRouter.use(['/resend-otp', '/forgot-password'], mailLimiter);
export const passwordRule = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password needs an uppercase letter')
    .regex(/[a-z]/, 'Password needs a lowercase letter')
    .regex(/[0-9]/, 'Password needs a number');
export const studentFields = {
    fullName: z.string().trim().min(2, 'Full name is required').max(100),
    mobile: z.string().trim().regex(/^[+]?[0-9]{10,13}$/, 'Enter a valid mobile number'),
    college: z.string().trim().min(2, 'College name is required').max(150),
    regNo: z.string().trim().min(2, 'Registration number is required').max(40),
    branch: z.string().trim().min(2, 'Branch is required').max(80),
    graduationYear: z.coerce.number().int().min(2000).max(2100),
};
const MAX_FAILED = 5;
const LOCK_MIN = 15;
export const userPayload = async (id) => {
    const u = await prisma.user.findUniqueOrThrow({ where: { id }, include: { role: true, student: { include: { batch: true } }, admin: true } });
    return {
        id: u.id,
        email: u.email,
        role: u.role.name,
        emailVerified: u.emailVerified,
        fullName: u.student?.fullName ?? u.admin?.fullName ?? u.email,
        student: u.student
            ? { regNo: u.student.regNo, mobile: u.student.mobile, college: u.student.college, branch: u.student.branch, graduationYear: u.student.graduationYear, batch: u.student.batch?.name ?? null }
            : null,
    };
};
export async function issueOtp(userId, email, purpose, name) {
    const code = generateOtp();
    await prisma.otpCode.updateMany({ where: { userId, purpose, consumedAt: null }, data: { consumedAt: new Date() } });
    await prisma.otpCode.create({ data: { userId, purpose, codeHash: sha256(code), expiresAt: new Date(Date.now() + 10 * 60000) } });
    const subject = purpose === 'VERIFY_EMAIL' ? 'Verify your email address' : 'Reset your password';
    const intro = purpose === 'VERIFY_EMAIL' ? 'Use this one-time code to verify your account.' : 'Use this one-time code to reset your password.';
    await sendMail(email, subject, renderEmail(subject, [`Hello ${name},`, intro, `Your code: ${code}`, 'The code expires in 10 minutes. If you did not request it, ignore this email.']));
}
async function consumeOtp(userId, purpose, code) {
    const otp = await prisma.otpCode.findFirst({ where: { userId, purpose, consumedAt: null }, orderBy: { createdAt: 'desc' } });
    if (!otp || otp.expiresAt < new Date())
        throw badRequest('The code has expired. Request a new one.', 'OTP_EXPIRED');
    if (otp.attempts >= 5)
        throw badRequest('Too many wrong attempts. Request a new code.', 'OTP_LOCKED');
    if (otp.codeHash !== sha256(code)) {
        await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
        throw badRequest('Incorrect code', 'OTP_INVALID');
    }
    await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
}
authRouter.post('/register', async (req, res) => {
    const body = z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email'), password: passwordRule, ...studentFields }).parse(req.body);
    const role = await prisma.role.findUniqueOrThrow({ where: { name: 'STUDENT' } });
    const user = await prisma.user.create({
        data: {
            email: body.email,
            passwordHash: await hashPassword(body.password),
            roleId: role.id,
            student: { create: { fullName: body.fullName, mobile: body.mobile, college: body.college, regNo: body.regNo.toUpperCase(), branch: body.branch, graduationYear: body.graduationYear } },
        },
    });
    await issueOtp(user.id, user.email, 'VERIFY_EMAIL', body.fullName);
    await notify({ userId: user.id, email: user.email, type: 'REGISTRATION', title: `Welcome to ${config.ORG_NAME}`, body: `Hi ${body.fullName}, your account has been created. Verify your email to start taking assessments.`, cta: { label: 'Open student portal', path: '/login' } });
    res.status(201).json({ ok: true, email: user.email, message: 'Account created. Enter the code sent to your email to verify it.' });
});
authRouter.post('/verify-otp', async (req, res) => {
    const { email, code } = z.object({ email: z.string().trim().toLowerCase().email(), code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code') }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
        throw badRequest('Incorrect code', 'OTP_INVALID');
    await consumeOtp(user.id, 'VERIFY_EMAIL', code);
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
    res.json({ ok: true });
});
authRouter.post('/resend-otp', async (req, res) => {
    const { email } = z.object({ email: z.string().trim().toLowerCase().email() }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email }, include: { student: true } });
    if (user && !user.emailVerified && user.student)
        await issueOtp(user.id, user.email, 'VERIFY_EMAIL', user.student.fullName);
    res.json({ ok: true, message: 'If the account exists, a new code has been sent.' });
});
authRouter.post('/login', async (req, res) => {
    const { identifier, password, portal } = z
        .object({ identifier: z.string().trim().min(1, 'Enter your email or registration number'), password: z.string().min(1, 'Enter your password'), portal: z.enum(['admin', 'student']) })
        .parse(req.body);
    const id = identifier.toLowerCase();
    const user = await prisma.user.findFirst({
        where: { OR: [{ email: id }, { student: { regNo: identifier.toUpperCase() } }] },
        include: { role: true },
    });
    const generic = unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
    if (!user)
        throw generic;
    if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw forbidden(`Too many failed attempts. Try again in ${Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)} minute(s).`, 'ACCOUNT_LOCKED');
    }
    if (!(await verifyPassword(password, user.passwordHash))) {
        const failed = user.failedLogins + 1;
        await prisma.user.update({ where: { id: user.id }, data: failed >= MAX_FAILED ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MIN * 60000) } : { failedLogins: failed } });
        throw generic;
    }
    const isAdmin = user.role.name === 'ADMIN';
    if ((portal === 'admin') !== isAdmin)
        throw forbidden(isAdmin ? 'Administrators must sign in through the admin portal.' : 'This account cannot access the admin portal.', 'WRONG_PORTAL');
    if (!user.isActive)
        throw forbidden('Your account has been disabled. Contact the administrator.', 'ACCOUNT_DISABLED');
    if (!user.emailVerified)
        throw forbidden('Please verify your email address first.', 'EMAIL_NOT_VERIFIED');
    await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } });
    req.user = { id: user.id, email: user.email, role: user.role.name };
    if (isAdmin)
        await audit(req, 'LOGIN', 'User', user.id);
    res.json({ token: signToken({ sub: user.id, role: req.user.role }), user: await userPayload(user.id) });
});
/** Quiet admin entry from the public page: the admin types their password in place of the email/mobile.
 *  Only active administrators are checked; failures are rate-limited hard per IP. */
const passkeyLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, skipSuccessfulRequests: true, standardHeaders: true, legacyHeaders: false, message: tooMany });
authRouter.post('/passkey', passkeyLimiter, async (req, res) => {
    const { secret } = z.object({ secret: z.string().min(8).max(200) }).parse(req.body);
    const admins = await prisma.user.findMany({ where: { role: { name: 'ADMIN' }, isActive: true }, include: { role: true } });
    const now = new Date();
    for (const user of admins) {
        if (user.lockedUntil && user.lockedUntil > now)
            continue;
        if (await verifyPassword(secret, user.passwordHash)) {
            await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: now } });
            req.user = { id: user.id, email: user.email, role: 'ADMIN' };
            await audit(req, 'LOGIN', 'User', user.id, { via: 'passkey' });
            res.json({ token: signToken({ sub: user.id, role: 'ADMIN' }), user: await userPayload(user.id) });
            return;
        }
    }
    throw unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
});
authRouter.post('/forgot-password', async (req, res) => {
    const { email } = z.object({ email: z.string().trim().toLowerCase().email() }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email }, include: { student: true, admin: true } });
    if (user && user.isActive)
        await issueOtp(user.id, user.email, 'RESET_PASSWORD', user.student?.fullName ?? user.admin?.fullName ?? 'there');
    res.json({ ok: true, message: 'If the account exists, a reset code has been sent to the email.' });
});
authRouter.post('/reset-password', async (req, res) => {
    const { email, code, password } = z.object({ email: z.string().trim().toLowerCase().email(), code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'), password: passwordRule }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
        throw badRequest('Incorrect code', 'OTP_INVALID');
    await consumeOtp(user.id, 'RESET_PASSWORD', code);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password), failedLogins: 0, lockedUntil: null, emailVerified: true } });
    res.json({ ok: true });
});
authRouter.get('/me', authenticate, async (req, res) => {
    res.json({ user: await userPayload(req.user.id) });
});
authRouter.post('/change-password', authenticate, async (req, res) => {
    const { currentPassword, newPassword } = z.object({ currentPassword: z.string().min(1), newPassword: passwordRule }).parse(req.body);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user.id } });
    if (!(await verifyPassword(currentPassword, user.passwordHash)))
        throw badRequest('Current password is incorrect', 'WRONG_PASSWORD');
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } });
    if (req.user.role === 'ADMIN')
        await audit(req, 'CHANGE_PASSWORD', 'User', user.id);
    res.json({ ok: true });
});
/** Admin self-service: change the login ID and/or password (current password required). */
authRouter.put('/account', authenticate, async (req, res) => {
    if (req.user.role !== 'ADMIN')
        throw forbidden('Only administrators can change these details here.');
    const d = z.object({
        currentPassword: z.string().min(1, 'Enter your current password'),
        loginId: z.string().trim().toLowerCase().regex(/^[a-z0-9._@+-]{3,60}$/, 'Login ID must be 3–60 characters: letters, digits and . _ @ + -').optional(),
        newPassword: passwordRule.optional(),
    }).parse(req.body);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user.id } });
    if (!(await verifyPassword(d.currentPassword, user.passwordHash)))
        throw badRequest('Current password is incorrect', 'WRONG_PASSWORD');
    if (!d.loginId && !d.newPassword)
        throw badRequest('Enter a new login ID or a new password');
    await prisma.user.update({ where: { id: user.id }, data: { ...(d.loginId ? { email: d.loginId } : {}), ...(d.newPassword ? { passwordHash: await hashPassword(d.newPassword) } : {}) } });
    await audit(req, 'UPDATE_ADMIN_ACCOUNT', 'User', user.id, { loginIdChanged: !!d.loginId && d.loginId !== user.email, passwordChanged: !!d.newPassword });
    res.json({ ok: true, user: await userPayload(user.id) });
});
authRouter.post('/logout', authenticate, async (req, res) => {
    if (req.user.role === 'ADMIN')
        await audit(req, 'LOGOUT', 'User', req.user.id);
    res.json({ ok: true });
});
