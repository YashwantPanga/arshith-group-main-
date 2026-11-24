import { prisma } from '../db.js';
import { config } from '../config.js';
import { hashPassword } from '../lib/password.js';
/** Idempotent bootstrap: roles, question categories and the first administrator. */
async function main() {
    for (const name of ['ADMIN', 'STUDENT'])
        await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
    const cats = [
        { code: 'TECHNICAL', name: 'Technical Questions', position: 0 },
        { code: 'QUANT', name: 'Quantitative Aptitude', position: 1 },
        { code: 'LOGICAL', name: 'Logical Reasoning', position: 2 },
        { code: 'VERBAL', name: 'Verbal Ability', position: 3 },
        { code: 'CODING', name: 'Coding', position: 4 },
        { code: 'PROGRAMMING', name: 'Coding (Python, Java, Web)', position: 5 },
    ];
    for (const c of cats)
        await prisma.questionCategory.upsert({ where: { code: c.code }, update: { name: c.name, position: c.position }, create: c });
    const role = await prisma.role.findUniqueOrThrow({ where: { name: 'ADMIN' } });
    const email = config.ADMIN_EMAIL.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        console.log(`Admin ${email} already exists – left unchanged.`);
    }
    else {
        await prisma.user.create({
            data: { email, passwordHash: await hashPassword(config.ADMIN_PASSWORD), roleId: role.id, emailVerified: true, admin: { create: { fullName: config.ADMIN_NAME } } },
        });
        console.log(`✔ Admin created: ${email}`);
    }
    console.log('✔ Roles and question categories ready');
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
