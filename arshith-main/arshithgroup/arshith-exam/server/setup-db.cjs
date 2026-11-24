// One-time setup: loads the question paper and question bank into the empty database, then creates the admin from .env.
// Refuses to run on a database that already has data, so pressing it again cannot damage anything.
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL.split('?')[0] });
  await client.connect();
  const { rows } = await client.query(`SELECT to_regclass('public.users') AS t`);
  if (rows[0].t) { console.log('Database already set up. Nothing changed.'); await client.end(); return; }
  await client.query(fs.readFileSync(path.join(__dirname, 'exam-data.sql'), 'utf8'));
  await client.query(`SELECT pg_catalog.set_config('search_path', 'public', false)`);
  const count = await client.query('SELECT (SELECT count(*) FROM questions) AS q, (SELECT count(*) FROM assessments) AS a');
  console.log(`Loaded ${count.rows[0].a} question paper(s) and ${count.rows[0].q} questions.`);
  await client.end();
  process.chdir(__dirname);
  await import('./dist/seed/index.js');
})().catch((e) => { console.error('Setup failed:', e.message); process.exit(1); });
