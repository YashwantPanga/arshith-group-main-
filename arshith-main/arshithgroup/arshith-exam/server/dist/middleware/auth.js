import { prisma } from '../db.js';
import { forbidden, unauthorized } from '../lib/errors.js';
import { verifyToken } from '../lib/jwt.js';
import { memo } from '../lib/cache.js';
/** Verifies the JWT and re-checks the account in the database so disabled users are cut off immediately. */
export const authenticate = async (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
        throw unauthorized();
    let payload;
    try {
        payload = verifyToken(header.slice(7));
    }
    catch {
        throw unauthorized('Session expired. Please sign in again.', 'TOKEN_INVALID');
    }
    // cached for 5 s: thousands of exam requests per second would otherwise each re-read the account
    const user = await memo(`user:${payload.sub}`, 5000, () => prisma.user.findUnique({ where: { id: payload.sub }, include: { role: true } }));
    if (!user)
        throw unauthorized('Account not found', 'TOKEN_INVALID');
    if (!user.isActive)
        throw forbidden('Your account has been disabled. Contact the administrator.', 'ACCOUNT_DISABLED');
    req.user = { id: user.id, email: user.email, role: user.role.name };
    next();
};
export const requireRole = (role) => (req, _res, next) => {
    if (!req.user)
        throw unauthorized();
    if (req.user.role !== role)
        throw forbidden();
    next();
};
export const adminOnly = [authenticate, requireRole('ADMIN')];
export const studentOnly = [authenticate, requireRole('STUDENT')];
