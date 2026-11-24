import 'dotenv/config';
import { z } from 'zod';
const schema = z.object({
    NODE_ENV: z.string().default('development'),
    PORT: z.coerce.number().default(4000),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(16),
    JWT_EXPIRES_IN: z.string().default('12h'),
    CLIENT_URL: z.string().default('http://localhost:5173'),
    ORG_NAME: z.string().default('Arshith Group'),
    ORG_TAGLINE: z.string().default('Online Assessment'),
    ADMIN_EMAIL: z.string().default('admin@example.com'),
    ADMIN_PASSWORD: z.string().default('ChangeMe@12345'),
    ADMIN_NAME: z.string().default('Super Admin'),
    SMTP_HOST: z.string().optional().default(''),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_SECURE: z.string().default('false'),
    SMTP_USER: z.string().optional().default(''),
    SMTP_PASS: z.string().optional().default(''),
    MAIL_FROM: z.string().default('Arshith Group <no-reply@example.com>'),
    SUBMIT_GRACE_SECONDS: z.coerce.number().default(10),
    REMINDER_MINUTES_BEFORE: z.coerce.number().default(60),
});
const parsed = schema.safeParse(process.env);
if (!parsed.success) {
    console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
    process.exit(1);
}
export const config = parsed.data;
export const isProd = config.NODE_ENV === 'production';
