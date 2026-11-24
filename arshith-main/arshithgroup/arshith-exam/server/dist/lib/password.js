import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
export const hashPassword = (p) => bcrypt.hash(p, 10);
export const verifyPassword = async (p, h) => (h.startsWith('$2') ? bcrypt.compare(p, h) : false);
/** Stored for accounts that never sign in with a password (walk-in students). Can never match. */
export const NO_PASSWORD = '!walk-in';
export const generatePassword = (len = 10) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const bytes = crypto.randomBytes(len);
    let out = '';
    for (let i = 0; i < len; i++)
        out += chars[bytes[i] % chars.length];
    return out + '@' + crypto.randomInt(10, 99);
};
export const generateOtp = () => String(crypto.randomInt(100000, 999999));
export const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
export const randomToken = () => crypto.randomBytes(24).toString('hex');
