import http from 'node:http';
import { createReadStream, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PUBLIC_DIR = join(__dirname, 'public');
const PORT = Number.parseInt(process.env.WEB_PORT ?? '5173', 10);
const HOST = process.env.WEB_HOST ?? '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let filePath = join(PUBLIC_DIR, url.pathname);
  if (url.pathname === '/' || url.pathname === '') {
    filePath = join(PUBLIC_DIR, 'index.html');
  }
  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }
  const ext = extname(filePath);
  const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  createReadStream(filePath).pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`Web server running at http://${HOST}:${PORT}`);
});
