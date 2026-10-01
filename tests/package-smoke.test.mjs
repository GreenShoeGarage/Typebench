import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {harness,waitSaved,download} from './harness.mjs';
const {p,url,context,report,check,finish}=await harness('package-smoke');
try{
 await context.addInitScript(()=>{Object.defineProperty(navigator,'platform',{get:()=> 'MacIntel'});window.showSaveFilePicker=undefined;});
 const external=[];p.on('request',r=>{if(!r.url().startsWith(new URL(url).origin))external.push(r.url());});
 await p.goto(url);await waitSaved(p);assert.equal(await p.locator('.version').textContent(),'v1.0.0');assert.equal(await p.locator('#commandNew kbd').textContent(),'⌘⌥N');assert.equal(await p.locator('#actionsOpen .shortcut').textContent(),'⌘⇧P');await p.locator('#emptyMarkdown').click();await p.locator('.cm-content').fill('# Packaged editor\n\n```arduino\nvoid setup() { pinMode(LED_BUILTIN, OUTPUT); }\n```\n');await p.waitForFunction(()=>document.getElementById('previewStatus').textContent==='Preview ready');assert(await p.locator('#preview .tok-func').count());
 await p.waitForFunction(()=>document.getElementById('offline').textContent==='Offline ready');await waitSaved(p);await context.setOffline(true);await p.reload();await p.waitForFunction(()=>document.getElementById('previewStatus').textContent==='Preview ready');const d=p.waitForEvent('download');await p.keyboard.press('Meta+s');assert((fs.readFileSync(await (await d).path())).toString().includes('pinMode'));assert((await download(p,'#exportHTML')).bytes.toString().includes('<h1'));assert.deepEqual(external,[]);assert.deepEqual(report.errors,[]);
 const root=process.env.TYPEBENCH_PACKAGE_DIR||'.';report.runtimeSHA256=Object.fromEntries(['index.html','assets/app.js','assets/app.css','assets/search-worker.js','assets/markdown-worker.js','assets/zip-worker.js','sw.js'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')]));
 check('Extracted ZIP starts under a subdirectory, has Mac shortcut labels, previews Arduino, reloads offline and exports without external requests');report.success=true;
}catch(e){report.success=false;report.failure=e.stack;console.error(e);process.exitCode=1;}finally{await finish();}
