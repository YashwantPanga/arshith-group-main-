import { prisma } from '../db.js';
import { config } from '../config.js';
import { renderEmail, sendMail } from './mailer.js';
/** In-app notification + email. Safe to fire-and-forget. */
export async function notify(n) {
    await prisma.notification.create({ data: { userId: n.userId, type: n.type, title: n.title, body: n.body } }).catch(() => { });
    if (n.emailToo !== false) {
        const cta = n.cta ? { label: n.cta.label, url: config.CLIENT_URL + n.cta.path } : undefined;
        await sendMail(n.email, n.title, renderEmail(n.title, [n.body], cta));
    }
}
export const fmtDateTime = (d) => d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }) + ' IST';
