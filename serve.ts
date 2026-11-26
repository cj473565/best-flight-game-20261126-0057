// A tiny static server for game/ (Node 22, standard library only),
// so the entry can be played locally without a build step:
//   node serve.ts            serves game/ on http://localhost:8080
//   node serve.ts --port 9000
// It sends the MIME types a browser game needs, refuses any path
// outside game/, and otherwise does nothing clever: this is a
// development convenience, not a web server for the internet.

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const requested = portIndex === -1 ? 8080 : Number(args[portIndex + 1]);
const port = Number.isInteger(requested) && requested > 0 && requested < 65536 ? requested : 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let path = normalize(join(root, decodeURIComponent(url.pathname)));
  if (!path.startsWith(root + sep) && path !== root) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }
  if (path === root) path = join(root, 'index.html');
  let stat;
  try {
    stat = statSync(path);
  } catch {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  if (stat.isDirectory()) {
    path = join(path, 'index.html');
    try {
      stat = statSync(path);
    } catch {
      res.writeHead(404);
      res.end('not found');
      return;
    }
  }
  res.writeHead(200, {
    'content-type': MIME[extname(path)] ?? 'application/octet-stream',
    'content-length': stat.size,
  });
  createReadStream(path).pipe(res);
});

server.listen(port, () => {
  console.log(`Sunset Isles at http://localhost:${port}/`);
});
