import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 8798);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port');
const routes = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/planner.mjs', ['planner.mjs', 'text/javascript; charset=utf-8']],
  ['/ui.mjs', ['ui.mjs', 'text/javascript; charset=utf-8']],
]);
const server = createServer(async (request, response) => {
  const route = routes.get(new URL(request.url, 'http://localhost').pathname);
  if (!route || request.method !== 'GET') {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  try {
    const data = await readFile(join(root, route[0]));
    response.writeHead(200, {
      'Content-Type': route[1],
      'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'none'; img-src 'none'; form-action 'none'; base-uri 'none'",
      'Cache-Control': 'no-store',
    });
    response.end(data);
  } catch {
    response.writeHead(500);
    response.end('Could not load local file');
  }
});
server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`PUDDLE-001 local-only demo: http://127.0.0.1:${port}/\n`);
});
