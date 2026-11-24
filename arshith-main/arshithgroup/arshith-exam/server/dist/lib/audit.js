import { prisma } from '../db.js';
export const clientIp = (req) => (req.ip ?? req.socket.remoteAddress ?? '').replace('::ffff:', '');
export async function audit(req, action, entity, entityId, meta) {
    await prisma.auditLog
        .create({ data: { actorId: req.user?.id, action, entity, entityId: entityId ?? undefined, meta: meta, ip: clientIp(req) } })
        .catch((e) => console.error('audit failed', e));
}
