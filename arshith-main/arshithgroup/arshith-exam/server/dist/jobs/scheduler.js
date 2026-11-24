import { prisma } from '../db.js';
import { config } from '../config.js';
import { autoSubmitDue } from '../modules/examService.js';
import { fmtDateTime, notify } from '../lib/notify.js';
let running = false;
/** Periodic housekeeping: auto-submit expired attempts, send "now live" and reminder notifications. */
async function tick() {
    if (running)
        return;
    running = true;
    try {
        await autoSubmitDue();
        const now = new Date();
        const live = await prisma.examSchedule.findMany({ where: { status: 'PUBLISHED', startAt: { lte: now }, endAt: { gt: now }, startNotifiedAt: null } });
        for (const s of live) {
            const claim = await prisma.examSchedule.updateMany({ where: { id: s.id, startNotifiedAt: null }, data: { startNotifiedAt: now } });
            if (!claim.count)
                continue;
            const people = await prisma.examAssignment.findMany({ where: { scheduleId: s.id }, include: { student: true } });
            for (const p of people)
                void notify({ userId: p.studentId, email: p.student.email, type: 'EXAM_LIVE', title: `Now live: ${s.name}`, body: `"${s.name}" is now available. It closes at ${fmtDateTime(s.endAt)}. Duration: ${s.durationMin} minutes.`, cta: { label: 'Start examination', path: `/join/${s.id}` } });
        }
        const soon = new Date(now.getTime() + config.REMINDER_MINUTES_BEFORE * 60000);
        const upcoming = await prisma.examSchedule.findMany({ where: { status: 'PUBLISHED', startAt: { gt: now, lte: soon }, reminderSentAt: null } });
        for (const s of upcoming) {
            const claim = await prisma.examSchedule.updateMany({ where: { id: s.id, reminderSentAt: null }, data: { reminderSentAt: now } });
            if (!claim.count)
                continue;
            const people = await prisma.examAssignment.findMany({ where: { scheduleId: s.id }, include: { student: true } });
            for (const p of people)
                void notify({ userId: p.studentId, email: p.student.email, type: 'REMINDER', title: `Starting soon: ${s.name}`, body: `"${s.name}" begins at ${fmtDateTime(s.startAt)}. Keep your login details ready and use a stable internet connection.`, cta: { label: 'Open exam', path: `/join/${s.id}` } });
        }
    }
    catch (e) {
        console.error('[scheduler] tick failed', e);
    }
    finally {
        running = false;
    }
}
export function startScheduler() {
    setInterval(tick, 15000).unref();
    void tick();
}
