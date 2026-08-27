import { createReadStream, lstatSync, realpathSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 18082;
const MAX_URL_LENGTH = 8_192;

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

function parsePort(value) {
  const parsed = Number(value ?? DEFAULT_PORT);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65_535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  return parsed;
}

function validateHost(value) {
  const host = value || DEFAULT_HOST;
  if (process.env.NODE_ENV === 'production' && !['127.0.0.1', '::1'].includes(host)) {
    throw new Error('production HOST must be a loopback address');
  }
  return host;
}

function securityHeaders(response) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('X-Frame-Options', 'DENY');
}

function json(response, status, payload, method = 'GET') {
  const body = Buffer.from(JSON.stringify(payload));
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Content-Length', body.length);
  securityHeaders(response);
  response.end(method === 'HEAD' ? undefined : body);
}

function resolveRequestPath(root, rawUrl) {
  if (!rawUrl || rawUrl.length > MAX_URL_LENGTH) return undefined;

  let pathname;
  try {
    pathname = new URL(rawUrl, 'http://localhost').pathname;
    pathname = decodeURIComponent(pathname);
  } catch {
    return undefined;
  }

  if (pathname.includes('\0') || pathname.includes('\\')) return undefined;
  const segments = pathname.split('/');
  if (segments.some((segment) => segment === '..')) return undefined;

  const relative = pathname.replace(/^\/+/, '');
  const candidate = path.resolve(root, relative || 'index.html');
  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) return undefined;
  return candidate;
}

function regularFileInsideRoot(root, candidate) {
  try {
    const lstat = lstatSync(candidate);
    if (!lstat.isFile() || lstat.isSymbolicLink()) return undefined;
    const real = realpathSync(candidate);
    if (!real.startsWith(`${root}${path.sep}`)) return undefined;
    return { path: real, stat: statSync(real) };
  } catch {
    return undefined;
  }
}

function cacheControl(filePath) {
  return filePath.includes(`${path.sep}assets${path.sep}`)
    ? 'public, max-age=31536000, immutable'
    : 'no-cache';
}

function serveFile(request, response, file) {
  const etag = `W/\"${file.stat.size.toString(16)}-${Math.trunc(file.stat.mtimeMs).toString(16)}\"`;
  securityHeaders(response);
  response.setHeader('Cache-Control', cacheControl(file.path));
  response.setHeader('Content-Type', mimeTypes.get(path.extname(file.path).toLowerCase()) || 'application/octet-stream');
  response.setHeader('Content-Length', file.stat.size);
  response.setHeader('ETag', etag);

  if (request.headers['if-none-match'] === etag) {
    response.statusCode = 304;
    response.removeHeader('Content-Length');
    response.end();
    return;
  }

  response.statusCode = 200;
  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  const stream = createReadStream(file.path);
  stream.on('error', () => {
    if (!response.headersSent) json(response, 500, { error: 'static file read failed' });
    else response.destroy();
  });
  stream.pipe(response);
}

export function createStaticServer(options = {}) {
  const configuredRoot = options.root || path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
  const root = realpathSync(configuredRoot);
  if (!statSync(root).isDirectory()) throw new Error('static root must be a directory');
  const indexFile = regularFileInsideRoot(root, path.join(root, 'index.html'));
  if (!indexFile) throw new Error('static root must contain a regular index.html');

  const server = createServer((request, response) => {
    if (!['GET', 'HEAD'].includes(request.method || '')) {
      response.setHeader('Allow', 'GET, HEAD');
      json(response, 405, { error: 'method not allowed' }, request.method);
      return;
    }

    if (request.url === '/health') {
      json(response, 200, { status: 'ok', service: 'sgsyen-web' }, request.method);
      return;
    }

    const candidate = resolveRequestPath(root, request.url);
    if (!candidate) {
      json(response, 400, { error: 'invalid request path' }, request.method);
      return;
    }

    const file = regularFileInsideRoot(root, candidate);
    if (file) {
      serveFile(request, response, file);
      return;
    }

    const acceptsHtml = (request.headers.accept || '').split(',')
      .some((value) => value.trim().split(';', 1)[0] === 'text/html');
    if (acceptsHtml && path.extname(candidate) === '') {
      serveFile(request, response, indexFile);
      return;
    }
    json(response, 404, { error: 'static file not found' }, request.method);
  });

  server.keepAliveTimeout = 5_000;
  server.headersTimeout = 10_000;
  server.requestTimeout = 15_000;
  return server;
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  const host = validateHost(process.env.HOST);
  const port = parsePort(process.env.PORT);
  const server = createStaticServer();

  server.listen(port, host, () => {
    console.log(`sgsyen-web listening on http://${host}:${port}`);
  });

  const shutdown = () => server.close((error) => {
    if (error) {
      console.error('sgsyen-web shutdown failed');
      process.exitCode = 1;
    }
  });
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
