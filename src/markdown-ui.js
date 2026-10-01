// TYPEBENCH — GPL-3.0-only.
import DOMPurify from 'dompurify';
import {replaceChanges,EditorView} from './editor.js';
import {escapeHTML} from './languages.js';
const $=id=>document.getElementById(id);
const safeConfig={ALLOWED_TAGS:['p','br','hr','h1','h2','h3','h4','h5','h6','em','strong','del','blockquote','ul','ol','li','a','pre','code','span','table','thead','tbody','tr','th','td','input'],ALLOWED_ATTR:['href','title','id','class','type','checked','disabled','start','align','data-image','data-alt'],ALLOW_DATA_ATTR:false,FORBID_TAGS:['style','script','img','svg','math','iframe','object','embed','form'],FORBID_ATTR:['style','src','srcset','name'],RETURN_DOM_FRAGMENT:true};
export class MarkdownPanel {
 constructor({getView,getDoc,getSettings,changed,notify,download,confirm}){
  Object.assign(this,{getView,getDoc,getSettings,changed,notify,download,confirm});this.epoch=0;this.allowed=new Set();this.result=null;this.timer=null;
  for(const mode of ['source','split','preview'])$('view'+mode).onclick=()=>{const d=this.getDoc();d.viewMode=mode;this.layout();this.changed();if(mode!=='source')this.schedule(true);};
  $('syncScroll').onchange=()=>{this.getSettings().syncScroll=$('syncScroll').checked;this.changed();};
  $('previewRetry').onclick=()=>this.schedule(true,15000);
  $('blockImages').onclick=()=>{this.allowed.clear();this.paint();};
  $('exportHTML').onclick=()=>this.export();$('printMarkdown').onclick=()=>{this.preparePrint();window.print();};
  $('outlineToggle').onclick=()=>{$('outline').hidden=!$('outline').hidden;$('outlineToggle').setAttribute('aria-expanded',String(!$('outline').hidden));};
  for(const b of document.querySelectorAll('[data-format]')){b.setAttribute('aria-label',b.title);b.onclick=()=>this.format(b.dataset.format);}
  const divider=$('previewDivider');
  const setRatio=n=>{this.getSettings().previewRatio=Math.min(75,Math.max(25,n));this.layout();};
  divider.onpointerdown=e=>{e.preventDefault();divider.setPointerCapture(e.pointerId);divider.onpointermove=e=>{const b=$('editorArea').getBoundingClientRect();setRatio((e.clientX-b.left)/b.width*100);};divider.onpointerup=()=>{divider.onpointermove=null;this.changed();};divider.onpointercancel=()=>{divider.onpointermove=null;this.changed();};};
  divider.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();setRatio(this.getSettings().previewRatio+(e.key==='ArrowRight'?5:-5));this.changed();}};
  $('preview').onscroll=()=>this.sync('preview');
  window.addEventListener('beforeprint',()=>this.preparePrint());
 }
 activate(){this.allowed.clear();this.result=null;this.epoch++;clearTimeout(this.timer);clearTimeout(this.workerTimer);this.worker?.terminate();$('preview').replaceChildren();$('outline').replaceChildren();this.layout();this.count();this.schedule(true);const v=this.getView();if(v)v.scrollDOM.onscroll=()=>this.sync('source');}
 layout(){const d=this.getDoc(),md=d?.language==='markdown',s=this.getSettings(),mode=md?(d.viewMode||'source'):'source';$('markdownBar').hidden=!md;$('markdownBar').dataset.view=mode;$('editorArea').hidden=!d;$('editorArea').dataset.view=mode;$('editorArea').style.setProperty('--source-width',s.previewRatio+'%');$('previewDivider').setAttribute('aria-valuenow',Math.round(s.previewRatio));$('syncScroll').checked=s.syncScroll;for(const x of ['source','split','preview'])$('view'+x).setAttribute('aria-pressed',String(mode===x));$('outline').hidden=true;$('outlineToggle').setAttribute('aria-expanded','false');this.getView()?.requestMeasure();}
 count(){clearTimeout(this.countTimer);this.countTimer=setTimeout(()=>{const d=this.getDoc(),v=this.getView();if(!d||!v){$('counts').textContent='';return;}const text=v.state.doc.toString();let words=0,characters=0;for(const match of text.matchAll(/[\p{L}\p{N}]+(?:['’_-][\p{L}\p{N}]+)*/gu))words++;for(const char of text)characters++;$('counts').textContent=`${words.toLocaleString()} words · ${characters.toLocaleString()} characters`;$('counts').title='Source counts; Unicode code points, including whitespace. Words are letter/number groups.';},250);}
 schedule(immediate=false,limit=5000){clearTimeout(this.timer);this.count();if(this.getDoc()?.language!=='markdown')return;this.result=null;this.epoch++;clearTimeout(this.workerTimer);this.worker?.terminate();const id=this.epoch,d=this.getDoc();$('previewStatus').textContent='Updating preview…';$('exportHTML').disabled=$('printMarkdown').disabled=true;
  this.timer=setTimeout(()=>{if(d!==this.getDoc())return;const text=this.getView().state.doc.toString();let worker;try{worker=this.worker=new Worker(new URL('./assets/markdown-worker.js',document.baseURI));}catch{$('previewStatus').textContent='Preview needs HTTPS or localhost. See Help for setup.';return;}const timeout=this.workerTimer=setTimeout(()=>{worker.terminate();if(id===this.epoch){$('previewStatus').textContent='Preview took too long. Source is safe; retry when ready.';$('previewRetry').hidden=false;}},limit);
  worker.onmessage=({data})=>{clearTimeout(timeout);worker.terminate();if(id!==this.epoch||d!==this.getDoc())return;if(data.error){$('previewStatus').textContent='Preview unavailable: '+data.error;return;}this.result=data;this.paint();};worker.onerror=()=>{clearTimeout(timeout);worker.terminate();if(id===this.epoch)$('previewStatus').textContent='Preview could not load. Your source is safe.';};worker.postMessage({id,text});},immediate?0:300);
 }
 fragment(images=false){const fragment=DOMPurify.sanitize(this.result?.html||'',safeConfig);for(const link of fragment.querySelectorAll('a')){const href=link.getAttribute('href')||'';if(!/^(https?:|mailto:|#)/i.test(href))link.removeAttribute('href');link.setAttribute('rel','noopener noreferrer');if(!href.startsWith('#'))link.setAttribute('target','_blank');}
  for(const [i,pre] of [...fragment.querySelectorAll('pre')].entries()){pre.tabIndex=0;pre.setAttribute('role','region');pre.setAttribute('aria-label','Code block '+(i+1));}
  for(const el of fragment.querySelectorAll('input')){el.setAttribute('type','checkbox');el.setAttribute('disabled','');el.setAttribute('aria-label',el.closest('li')?.textContent.trim()||'Task item');}
  for(const el of fragment.querySelectorAll('[data-image]')){
   const value=el.dataset.image;let url=null;try{const u=new URL(value,location.href);if(['http:','https:'].includes(u.protocol)||/^data:image\/(png|jpe?g|gif|webp);base64,/i.test(value))url=u.href;}catch{}
   el.removeAttribute('data-image');const alt=el.dataset.alt;el.removeAttribute('data-alt');
   if(images&&url&&this.allowed.has(url)){const img=document.createElement('img');img.alt=alt||'';img.referrerPolicy='no-referrer';img.src=url;el.replaceWith(img);}
   else if(images&&url){const b=document.createElement('button');b.type='button';b.className='load-image';b.textContent=el.textContent+' · Load';b.title=url;b.onclick=async()=>{if(await this.confirm('Load this image?',url.startsWith('data:')?'Display this embedded image? Permission lasts for this open document view.':`This requests the image from ${url}. The server may receive your IP address. Permission lasts for this open document view.`)){this.allowed.add(url);this.paint();}};el.replaceWith(b);}
   else {el.textContent=(el.textContent||'Image')+' (image not embedded)';}
  }return fragment;
 }
 paint(){if(!this.result)return;const preview=$('preview'),scroll=preview.scrollTop;preview.replaceChildren(this.fragment(true));preview.scrollTop=scroll;const list=$('outline');list.replaceChildren();const headings=preview.querySelectorAll('h1,h2,h3,h4,h5,h6');headings.forEach((h,i)=>{const b=document.createElement('button');b.textContent=h.textContent;b.style.paddingLeft=(10+(+h.tagName[1]-1)*10)+'px';b.onclick=()=>{const v=this.getView(),pos=Math.min(this.result.starts[i]||0,v.state.doc.length);v.dispatch({selection:{anchor:pos},effects:EditorView.scrollIntoView(pos,{y:'start'})});h.scrollIntoView({block:'start'});if(innerWidth<761)list.hidden=true;};list.append(b);});if(!headings.length)list.textContent='No headings yet.';$('previewStatus').textContent='Preview ready';$('previewRetry').hidden=true;$('blockImages').hidden=!this.allowed.size;$('exportHTML').disabled=$('printMarkdown').disabled=false;}
 sync(from){if(this.lock||!this.getSettings().syncScroll||$('editorArea').dataset.view!=='split')return;const v=this.getView();if(!v)return;this.lock=true;const a=from==='source'?v.scrollDOM:$('preview'),b=from==='source'?$('preview'):v.scrollDOM;const ratio=a.scrollTop/Math.max(1,a.scrollHeight-a.clientHeight);b.scrollTop=ratio*(b.scrollHeight-b.clientHeight);requestAnimationFrame(()=>this.lock=false);}
 format(kind){const v=this.getView();if(!v)return;const sel=v.state.selection.main,text=v.state.sliceDoc(sel.from,sel.to);let changes=[],anchor=sel.from,head=sel.to;
  const wrappers={bold:['**','**'],italic:['_','_'],strike:['~~','~~'],code:['`','`'],link:['[','](https://example.com)']};
  if(wrappers[kind]){const [a,b]=wrappers[kind];if(text.startsWith(a)&&text.endsWith(b)&&text.length>=a.length+b.length){changes=[{from:sel.from,to:sel.from+a.length},{from:sel.to-b.length,to:sel.to}];head-=a.length+b.length;}else if(sel.empty){const body=kind==='link'?'link text':kind==='code'?'code':'text';changes=[{from:sel.from,insert:a+body+b}];anchor+=a.length;head=anchor+body.length;}else{changes=[{from:sel.from,insert:a},{from:sel.to,insert:b}];anchor+=a.length;head+=a.length;}}
  else {const start=v.state.doc.lineAt(sel.from),end=v.state.doc.lineAt(sel.to>sel.from?sel.to-1:sel.to);anchor=start.from;head=end.to;
   if(kind==='fence'){changes=[{from:start.from,insert:'```\n'},{from:end.to,insert:'\n```'}];head+=8;}
   else{const prefix={heading:'## ',list:'- ',task:'- [ ] ',quote:'> '}[kind],lines=[];for(let n=start.number;n<=end.number;n++)lines.push(v.state.doc.line(n));const remove=lines.every(l=>l.text.startsWith(prefix));changes=lines.map(l=>remove?{from:l.from,to:l.from+prefix.length}:{from:l.from,insert:prefix});head+=(remove?-1:1)*prefix.length*lines.length;}}
  replaceChanges(v,changes);v.dispatch({selection:{anchor,head}});if(this.getDoc().viewMode==='preview'){this.getDoc().viewMode='split';this.layout();}v.focus();
 }
 export(){if(!this.result)return;const box=document.createElement('div');box.append(this.fragment(false));const d=this.getDoc(),title=escapeHTML(d.name);const css=$('printStyles').textContent;
  const html=`<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'none'; base-uri 'none'; form-action 'none'"><title>${title}</title><style>${css}</style></head><body class="markdown-document"><article>${box.innerHTML}</article></body></html>`;
  this.download(new Blob([html],{type:'text/html'}),d.name.split('/').pop().replace(/\.[^.]+$/,'')+'.html');this.notify('Styled HTML exported. Remote images are omitted; source is unchanged.');
 }
 preparePrint(){const box=$('printDocument');box.replaceChildren();const d=this.getDoc();if(!d)return;if(d.language==='markdown'&&this.result)box.append(this.fragment(true));else {const pre=document.createElement('pre');pre.textContent=this.getView().state.doc.toString();box.append(pre);}}
}
