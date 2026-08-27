import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createStaticServer } from '../server.mjs';

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'sgsyen-web-test-'));
  const dist = path.join(root, 'dist');
  await mkdir(path.join(dist, 'assets'), { recursive: true });
  await writeFile(path.join(dist, 'index.html'), '<!doctype html><title>SGSYEN</title>');
  await writeFile(path.join(dist, 'assets', 'app-deadbeef.js'), 'console.log("ok")');
  return { dist, root };
}

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

test('health is explicit JSON and unsafe methods are rejected', async (t) => {
  const files = await fixture();
  const server = createStaticServer({ root: files.dist });
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(files.root, { recursive: true, force: true });
  });
  const base = await listen(server);

  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok', service: 'sgsyen-web' });
  assert.equal(health.headers.get('x-content-type-options'), 'nosniff');

  const post = await fetch(`${base}/health`, { method: 'POST' });
  assert.equal(post.status, 405);
  assert.equal(post.headers.get('allow'), 'GET, HEAD');
});

test('serves immutable assets, HEAD, ETag and SPA fallback', async (t) => {
  const files = await fixture();
  const server = createStaticServer({ root: files.dist });
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(files.root, { recursive: true, force: true });
  });
  const base = await listen(server);

  const asset = await fetch(`${base}/assets/app-deadbeef.js`);
  assert.equal(asset.status, 200);
  assert.equal(asset.headers.get('cache-control'), 'public, max-age=31536000, immutable');
  assert.match(asset.headers.get('content-type'), /^text\/javascript/);
  assert.equal(await asset.text(), 'console.log("ok")');

  const head = await fetch(`${base}/assets/app-deadbeef.js`, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');

  const cached = await fetch(`${base}/assets/app-deadbeef.js`, {
    headers: { 'If-None-Match': asset.headers.get('etag') },
  });
  assert.equal(cached.status, 304);

  const fallback = await fetch(`${base}/research/example`, {
    headers: { Accept: 'text/html' },
  });
  assert.equal(fallback.status, 200);
  assert.match(await fallback.text(), /<title>SGSYEN<\/title>/);
  assert.equal(fallback.headers.get('cache-control'), 'no-cache');
});

test('does not follow symlinks outside the static root', async (t) => {
  const files = await fixture();
  const secret = path.join(files.root, 'outside.txt');
  await writeFile(secret, 'must-not-leak');
  await symlink(secret, path.join(files.dist, 'leak.txt'));
  const server = createStaticServer({ root: files.dist });
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(files.root, { recursive: true, force: true });
  });
  const base = await listen(server);

  const response = await fetch(`${base}/leak.txt`);
  assert.equal(response.status, 404);
  const body = await response.text();
  assert.doesNotMatch(body, /must-not-leak/);
  assert.deepEqual(JSON.parse(body), { error: 'static file not found' });
});
