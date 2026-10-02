import {VERSION} from '../src/core.js';
import {build} from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
await build({entryPoints:['src/app.js'],outfile:'assets/app.js',bundle:true,minify:true,format:'iife',target:['es2022'],legalComments:'linked'});
await build({entryPoints:['src/search-worker.js'],outfile:'assets/search-worker.js',bundle:true,minify:true,format:'iife',target:['es2022']});
await build({entryPoints:['src/markdown-worker.js'],outfile:'assets/markdown-worker.js',bundle:true,minify:true,format:'iife',target:['es2022'],legalComments:'linked'});
await build({entryPoints:['src/zip-worker.js'],outfile:'assets/zip-worker.js',bundle:true,minify:true,format:'iife',target:['es2022'],legalComments:'linked'});
await build({entryPoints:['src/snippet-worker.js'],outfile:'assets/snippet-worker.js',bundle:true,minify:true,format:'iife',target:['es2022'],legalComments:'linked'});
const dirs=fs.readdirSync('node_modules').flatMap(n=>n.startsWith('@')?fs.readdirSync('node_modules/'+n).map(c=>n+'/'+c):[n]);
const rows=[];
for(const n of dirs.filter(n=>n.startsWith('@codemirror/')||n.startsWith('@lezer/')||['style-mod','w3c-keyname','crelt','marked','dompurify','fflate'].includes(n))){
  const p=JSON.parse(fs.readFileSync('node_modules/'+n+'/package.json'));
  const license=['LICENSE','LICENSE.md','LICENSE.txt'].find(f=>fs.existsSync('node_modules/'+n+'/'+f));
  if(license)fs.copyFileSync('node_modules/'+n+'/'+license,'licenses/'+n.replaceAll('/','-')+'.txt');
  rows.push(`| ${n} | ${p.version} | ${p.license} |`);
}
fs.writeFileSync('THIRD-PARTY-NOTICES.md','# Bundled dependencies\n\nApplication: GNU GPL v3 only. Dependencies retain their licenses; full notices are in licenses/.\n\n| Package | Version | License |\n|---|---|---|\n'+rows.join('\n')+'\n\nDependencies are bundled in assets/app.js. No runtime package download is required. esbuild is a development-only bundler; Playwright and Chromium are development-only test tools and are not shipped as application dependencies.\n');
const files=['./','./index.html','./assets/app.js','./assets/app.css','./assets/search-worker.js','./assets/markdown-worker.js','./assets/zip-worker.js','./assets/snippet-worker.js','./assets/favicon.svg','./README.md','./LICENSE','./THIRD-PARTY-NOTICES.md'];
const hash=crypto.createHash('sha256');for(const f of files.filter(f=>f!=='./'))if(fs.existsSync(f))hash.update(fs.readFileSync(f));
const cache=VERSION+'-'+hash.digest('hex').slice(0,12);
fs.writeFileSync('sw.js',`// TYPEBENCH offline shell. GPL-3.0-only.\nconst PREFIX='typebench@'+self.registration.scope+':',CACHE=PREFIX+${JSON.stringify(cache)},FILES=${JSON.stringify(files)};\nself.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));});\nself.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);await self.clients.claim();})());});\nself.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||!u.href.startsWith(self.registration.scope))return;e.respondWith(caches.open(CACHE).then(async c=>(await c.match(e.request))||fetch(e.request)));});\n`);
console.log(`Built TYPEBENCH v${VERSION} with local dependencies.`);
