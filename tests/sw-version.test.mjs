// The service worker saves everything under one version name. If a site file changes and the name
// does not, phones keep showing the old copy. This fails until `node tools/stamp-sw.mjs` is run.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { version, files } from '../tools/stamp-sw.mjs';

test('every file the service worker saves exists', () => {
  const missing = files.filter(f => !existsSync(new URL('../' + f, import.meta.url)));
  assert.deepEqual(missing, []);
});
test('CACHE_VERSION matches the files (run: node tools/stamp-sw.mjs)', () => {
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  assert.equal(sw.match(/const CACHE_VERSION = '([^']*)';/)[1], version);
});
