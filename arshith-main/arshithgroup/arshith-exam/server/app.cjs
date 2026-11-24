// Startup file for hosting panels ("Setup Node.js App"). Panels start a CommonJS file and manage one process themselves.
process.env.WORKERS = '1';
if (process.env.PORT && Number.isNaN(Number(process.env.PORT))) delete process.env.PORT;
import('./dist/index.js').catch((e) => { console.error(e); process.exit(1); });
