import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
/** Each server worker keeps its own small pool (6 workers × 12 = 72 connections, well under PostgreSQL's default 100). */
function url() {
    const raw = process.env.DATABASE_URL ?? '';
    if (!raw || /[?&]connection_limit=/.test(raw))
        return raw;
    return `${raw}${raw.includes('?') ? '&' : '?'}connection_limit=${process.env.DB_POOL ?? 12}&pool_timeout=20`;
}
export const prisma = new PrismaClient({ datasources: { db: { url: url() } } });
