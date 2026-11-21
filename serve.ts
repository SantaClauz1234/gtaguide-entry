// Leonida Ledger local preview server (recorded-v3 touch-up, 21 Nov 2026).
// A small static file server for trying the guide locally:
//   node serve.ts [--port 8123]
// It serves only the files under app/ (the guide's root) on localhost and
// answers 404 for everything else. Development convenience only — the guide
// itself needs no server beyond any static host.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const argv = process.argv.slice(2);
const portFlag = argv.indexOf('--port');
const parsed = portFlag === -1 ? 8080 : Number(argv[portFlag + 1]);
const port = Number.isInteger(parsed) && parsed > 0 && parsed < 65536 ? parsed : 8080;

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

createServer((req, res) => {
  const wanted = decodeURIComponent((req.url ?? '/').split('?')[0]);
  const candidate = normalize(join(appRoot, wanted === '/' ? 'index.html' : wanted));
  if (candidate !== appRoot && !candidate.startsWith(appRoot + sep)) {
    res.writeHead(403); res.end(); return;
  }
  let file = candidate;
  try {
    if (statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!statSync(file).isFile()) throw new Error('missing');
  } catch {
    res.writeHead(404); res.end('not found'); return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Leonida Ledger serving at http://localhost:${port}`));
