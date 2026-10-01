// TYPEBENCH offline shell. GPL-3.0-only.
const PREFIX='typebench@'+self.registration.scope+':',CACHE=PREFIX+"1.0.0-972a8e643fa1",FILES=["./","./index.html","./assets/app.js","./assets/app.css","./assets/search-worker.js","./assets/markdown-worker.js","./assets/zip-worker.js","./assets/favicon.svg","./README.md","./LICENSE","./THIRD-PARTY-NOTICES.md"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);await self.clients.claim();})());});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||!u.href.startsWith(self.registration.scope))return;e.respondWith(caches.open(CACHE).then(async c=>(await c.match(e.request))||fetch(e.request)));});
