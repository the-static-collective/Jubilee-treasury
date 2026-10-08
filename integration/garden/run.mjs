import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { GARDEN_COMMIT } from '../../src/routing/garden-adapter.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const donor = path.join(root, 'dist', 'garden-source');
const container = `jubilee-routing-${process.pid}`;
function run(cmd, args, extra = {}) { return execFileSync(cmd, args, { stdio: 'inherit', ...extra }); }
mkdirSync(path.dirname(donor), { recursive: true });
try { run('git', ['-C', donor, 'rev-parse', '--git-dir'], { stdio: 'ignore' }); }
catch { run('git', ['clone', '--no-checkout', 'https://github.com/the-static-collective/BananaSpork.git', donor]); }
run('git', ['-C', donor, 'checkout', '--detach', GARDEN_COMMIT]);
const actual = execFileSync('git', ['-C', donor, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (actual !== GARDEN_COMMIT) throw new Error('Source version mismatch');
// Reset tracked donor files to the pinned commit; untracked files are never loaded.
run('git', ['-C', donor, 'restore', '--source', GARDEN_COMMIT, '--worktree', '.']);
const image = 'postgres:17-alpine@sha256:b0f9560a2de083e2cc7382e75f808c7381a32852a7ec49117deedb300e552b24';
try {
  run('docker', ['run', '-d', '--name', container, '--network', 'none', '-e', 'POSTGRES_HOST_AUTH_METHOD=trust', image]);
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { run('docker', ['exec', container, 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres'], { stdio: 'ignore' }); ready = true; break; }
    catch { await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  if (!ready) throw new Error('Isolated PostgreSQL did not start');
  const migrations = [path.join(root, 'integration/garden/bootstrap.sql'),
    ...['20260727002843_d860da9d-a3c6-41f5-847b-39a0d409d1e9.sql',
      '20260727002901_d2f795d8-ebe5-4263-811d-54d118fe5ceb.sql',
      '20260727003814_e10b6e1d-fe9e-421e-9de3-9aaddb56b8ca.sql',
      '20260727003833_518baa38-530c-4b52-82b0-df0946148ceb.sql',
      '20260728011414_265c5e0c-31a5-49fc-a217-2d8988cd1198.sql'].map(f => path.join(donor, 'supabase/migrations', f)),
    path.join(root, 'integration/garden/capacity-admission.sql')];
  for (const file of migrations) run('docker', ['exec', '-i', container, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-q'],
    { input: readFileSync(file), stdio: ['pipe', 'inherit', 'inherit'] });
  run(process.execPath, ['--test', '--test-concurrency=1', 'integration/garden/native.test.mjs'],
    { cwd: root, env: { ...process.env, GARDEN_SOURCE: donor, GARDEN_DATABASE_CONTAINER: container } });
} finally { run('docker', ['rm', '-f', '-v', container]); }
