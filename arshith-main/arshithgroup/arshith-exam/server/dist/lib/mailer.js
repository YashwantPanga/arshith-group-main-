import nodemailer from 'nodemailer';
import { config } from '../config.js';
import { prisma } from '../db.js';
const transporter = config.SMTP_HOST
    ? nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_SECURE === 'true',
        auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASS } : undefined,
    })
    : null;
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export function renderEmail(title, lines, cta) {
    const body = lines.map((l) => `<p style="margin:0 0 12px;color:#334155;font-size:14px;line-height:1.6">${esc(l)}</p>`).join('');
    const btn = cta
        ? `<p style="margin:20px 0"><a href="${cta.url}" style="background:#05361f;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:14px">${esc(cta.label)}</a></p>`
        : '';
    return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
<div style="background:#05361f;color:#fff;padding:16px 22px;font-size:18px">${esc(config.ORG_NAME)}</div>
<div style="padding:22px"><h2 style="margin:0 0 14px;color:#05361f;font-size:18px">${esc(title)}</h2>${body}${btn}</div>
<div style="background:#f8f5ee;color:#64748b;padding:12px 22px;font-size:12px">${esc(config.ORG_TAGLINE)} · This is an automated message.</div></div>`;
}
/** Sends (or only logs when SMTP isn't configured). Never throws – email must not break a request. */
export async function sendMail(to, subject, html) {
    let status = 'LOGGED';
    let error;
    if (transporter) {
        try {
            await transporter.sendMail({ from: config.MAIL_FROM, to, subject, html });
            status = 'SENT';
        }
        catch (e) {
            status = 'FAILED';
            error = e.message;
        }
    }
    else {
        console.log(`[mail:dev] to=${to} subject="${subject}"`);
    }
    await prisma.emailLog.create({ data: { to, subject, body: html, status, error } }).catch(() => { });
}
