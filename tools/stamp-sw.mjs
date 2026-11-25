// Writes a fingerprint of every file the service worker saves into CACHE_VERSION in sw.js.
// Run after changing any site file:   node tools/stamp-sw.mjs
// `node tools/stamp-sw.mjs --check` only checks (used by the tests) and exits 1 if sw.js is out of date.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const swPath = join(root, 'sw.js');
const sw = readFileSync(swPath, 'utf8');

const list = sw.slice(sw.indexOf('const PRECACHE'), sw.indexOf('];', sw.indexOf('const PRECACHE')));
const files = [...list.matchAll(/'([^']+)'/g)].map(m => m[1]).map(f => (f === './' ? 'index.html' : f));

const hash = createHash('sha256');
// The worker's own logic counts too, but not the version line itself.
hash.update(sw.replace(/const CACHE_VERSION = '[^']*';/, ''));
for(const f of [...new Set(files)].sort()){ hash.update(f); hash.update(readFileSync(join(root, f))); }
const version = 'mj-' + hash.digest('hex').slice(0, 8);

export { version, files };
if(process.argv[1] === fileURLToPath(import.meta.url)){
  const current = (sw.match(/const CACHE_VERSION = '([^']*)';/) || [])[1];
  if(process.argv.includes('--check')){
    if(current !== version){ console.error('sw.js CACHE_VERSION is ' + current + ' but the files add up to ' + version + '. Run: node tools/stamp-sw.mjs'); process.exit(1); }
    console.log('sw.js is up to date (' + version + ', ' + files.length + ' files)');
  }else{
    writeFileSync(swPath, sw.replace(/const CACHE_VERSION = '[^']*';/, "const CACHE_VERSION = '" + version + "';"));
    console.log(current === version ? 'already ' + version : current + ' -> ' + version);
  }
}
