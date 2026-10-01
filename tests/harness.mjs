import {chromium as playwright} from 'playwright';
import chromium from '@sparticuz/chromium';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
export async function harness(name){
 const root=path.resolve(process.env.TYPEBENCH_PACKAGE_DIR||'.'),report={date:new Date().toISOString(),version:JSON.parse(fs.readFileSync('package.json')).version,checks:[],errors:[]};
 const server=http.createServer((req,res)=>{let f=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/typebench\//,'/');if(f.endsWith('/'))f+='index.html';const full=path.resolve(root,'.'+f);if(!full.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(full,(e,b)=>{if(e){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.md':'text/plain'})[path.extname(f)]||'text/plain');res.end(b);});});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await playwright.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||await chromium.executablePath(),args:chromium.args.filter(x=>!['--single-process','--disable-web-security','--allow-running-insecure-content','--disable-site-isolation-trials'].includes(x)),headless:true});report.browser=browser.version();
 const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});const p=await context.newPage();p.setDefaultTimeout(15000);p.on('pageerror',e=>report.errors.push(e.message));p.on('dialog',d=>d.accept());
 const url=`http://127.0.0.1:${server.address().port}/typebench/`;
 return {p,url,context,browser,report,check:n=>{report.checks.push(n);console.log('PASS',n);},finish:async()=>{fs.writeFileSync('docs/'+name+'-results.json',JSON.stringify(report,null,2));await browser.close();server.close();}};
}
export const waitSaved=p=>p.waitForFunction(()=>document.getElementById('browserStatus').textContent.includes('Saved in this browser'));
export async function open(p,name,raw){await p.locator('#filePicker').setInputFiles({name,mimeType:'application/octet-stream',buffer:Buffer.from(raw)});await p.waitForFunction(n=>document.getElementById('filePath').textContent===n,name);}
export async function download(p,selector='#download'){const result=p.waitForEvent('download');await p.locator(selector).click();const d=await result;return {name:d.suggestedFilename(),bytes:fs.readFileSync(await d.path())};}
export async function command(p,text){await p.locator('#actionsOpen').click();await p.locator('#commandQuery').fill(text);await p.locator('#commandQuery').press('Enter');}
