// TYPEBENCH — GPL-3.0-only.
import {snippetOptions,snippetPalettes,cleanSpans} from './snippet-data.js';
import {snippetHTML,snippetDocument,snippetMarkdown,layoutSnippet,snippetSVG,paintSnippet,monoFont} from './snippet-render.js';
const $=id=>document.getElementById(id);
export class SnippetPanel{
 constructor({selection,getItems,setItems,insert,openDocument,hasDocument,notify,download,confirm}){
  Object.assign(this,{selection,getItems,setItems,insert,openDocument,hasDocument,notify,download,confirm});
  this.draft=null;this.ready=false;
  $('snippetCreate').onclick=()=>this.create();$('snippetsOpen').onclick=()=>this.library();
  const fields=['Name','Filename','StartLine','Theme','FontSize','Padding','TabSize','Background','Transparent','LineNumbers','ShowFilename','Scale'];
  for(const field of fields)$('snippet'+field).oninput=()=>{
   if(field==='Theme')$('snippetBackground').value=snippetPalettes[$('snippetTheme').value].background;
   this.readFields();this.paint();this.savedState(false);
  };
  $('snippetSave').onclick=()=>this.save();$('snippetSaveCopy').onclick=()=>this.save(true);
  $('snippetPNG').onclick=()=>this.png();$('snippetSVG').onclick=()=>this.export('svg');$('snippetHTML').onclick=()=>this.export('html');
  $('snippetCopyHTML').onclick=()=>this.copy(snippetHTML(this.draft),'HTML embed');
  $('snippetCopyMarkdown').onclick=()=>this.copy(snippetMarkdown(this.draft),'Markdown');
  $('snippetCopyCode').onclick=()=>this.copy(this.draft.raw,'Code');
  $('snippetCopyDownload').onclick=()=>this.download(new Blob([$('snippetCopyText').value],{type:'text/plain;charset=utf-8'}),this.copyName||'snippet.txt');
  $('snippetSearch').oninput=()=>this.renderLibrary();
  $('snippetDialog').addEventListener('close',()=>{this.stop();this.context=null;});
  $('snippetRetry').onclick=()=>this.highlight(15000);
 }
 create(){
  const data=this.selection();if(!data){this.notify('Select some text or code, then choose Create snippet.');return;}
  this.context=data.context;
  this.show({id:null,name:data.filename.split('/').pop()+' · lines '+data.startLine+'–'+data.endLine,filename:data.filename,raw:data.raw,language:data.language,startLine:data.startLine,options:snippetOptions(data.options),spans:[]},false);
  this.highlight();
 }
 show(item,ready=true){
  this.stop();this.draft=structuredClone(item);this.draft.options=snippetOptions(item.options);this.ready=ready;
  const s=this.draft,o=s.options;
  for(const [key,value] of Object.entries({Name:s.name,Filename:s.filename,StartLine:s.startLine,Theme:o.theme,FontSize:o.fontSize,Padding:o.padding,TabSize:o.tabSize,Background:o.background,Scale:o.scale}))$('snippet'+key).value=value;
  for(const [key,value] of Object.entries({Transparent:o.transparent,LineNumbers:o.lineNumbers,ShowFilename:o.showFilename}))$('snippet'+key).checked=value;
  $('snippetSource').textContent=s.language+' · '+s.raw.replace(/\r\n|\r/g,'\n').split('\n').length+' lines · snapshot of selected source';
  $('snippetStatus').textContent=ready?'Ready to export.':'Preparing syntax colors…';$('snippetRetry').hidden=true;
  this.savedState(!!s.id);this.paint();$('snippetDialog').showModal();
 }
 savedState(saved){$('snippetSave').textContent=this.draft?.id?(saved?'Saved snippet':'Save changes'):'Save snippet';$('snippetSave').disabled=saved||!this.ready;$('snippetSaveCopy').hidden=!this.draft?.id;}
 readFields(){
  const s=this.draft;if(!s)return;
  s.name=$('snippetName').value.trim()||'Untitled snippet';s.filename=$('snippetFilename').value;s.startLine=Math.max(1,Math.min(1000000000,Math.round(+$('snippetStartLine').value)||1));
  s.options=snippetOptions({theme:$('snippetTheme').value,fontSize:$('snippetFontSize').value,padding:$('snippetPadding').value,tabSize:$('snippetTabSize').value,background:$('snippetBackground').value,scale:$('snippetScale').value,transparent:$('snippetTransparent').checked,lineNumbers:$('snippetLineNumbers').checked,showFilename:$('snippetShowFilename').checked});
 }
 paint(){
  $('snippetPreview').innerHTML=snippetHTML(this.draft);
  for(const el of document.querySelectorAll('[data-snippet-export]'))el.disabled=!this.ready;
  $('snippetBackground').disabled=this.draft.options.transparent;
 }
 stop(){clearTimeout(this.timer);this.worker?.terminate();this.worker=null;}
 highlight(limit=5000){
  this.stop();this.ready=false;this.paint();this.savedState(false);$('snippetStatus').textContent='Preparing syntax colors…';$('snippetRetry').hidden=true;
  const fallback=message=>{this.stop();this.ready=true;this.draft.spans=[];this.paint();this.savedState(false);$('snippetStatus').textContent=message+' Plain-text exports are available.';$('snippetRetry').hidden=false;};
  try{
   this.worker=new Worker(new URL('./assets/snippet-worker.js',document.baseURI));
   this.worker.onmessage=({data})=>{if(data.error){fallback(data.error);return;}try{this.draft.spans=cleanSpans(data.spans,this.draft.raw.replace(/\r\n|\r/g,'\n').length);}catch(e){fallback(e.message);return;}this.stop();this.ready=true;this.paint();this.savedState(false);$('snippetStatus').textContent='Ready to export. Source document unchanged.';};
   this.worker.onerror=()=>fallback('Syntax coloring failed.');this.timer=setTimeout(()=>fallback('Syntax coloring took too long.'),limit);
   this.worker.postMessage({...this.context,language:this.draft.language});
  }catch{fallback('Syntax coloring needs HTTPS or localhost.');}
 }
 save(copy=false){
  if(!this.ready)return;this.readFields();const s=structuredClone(this.draft);
  if(copy||!s.id)s.id=crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
  if(copy)s.name+=' (copy)';const items=this.getItems().slice(),index=items.findIndex(x=>x.id===s.id);if(index<0)items.push(s);else items[index]=s;
  this.setItems(items);this.draft=s;$('snippetName').value=s.name;this.savedState(true);$('snippetStatus').textContent='Snippet added to this workspace. Browser save status is shown below.';
 }
 filename(ext){return (this.draft.name.replace(/[\x00-\x1f<>:"/\\|?*]/g,'-').replace(/[. ]+$/g,'').slice(0,100)||'snippet')+'.'+ext;}
 layout(){
  const ctx=document.createElement('canvas').getContext('2d');if(!ctx)throw new Error('Image measurement is unavailable. Export HTML instead.');
  return layoutSnippet(this.draft,(text,size,bold,italic)=>{ctx.font=`${italic?'italic ':''}${bold?'bold ':''}${size}px ${monoFont}`;return ctx.measureText(text).width;});
 }
 export(format){
  if(!this.ready)return;
  try{const content=format==='svg'?snippetSVG(this.draft,this.layout()):snippetDocument(this.draft);this.download(new Blob([content],{type:format==='svg'?'image/svg+xml;charset=utf-8':'text/html;charset=utf-8'}),this.filename(format));$('snippetStatus').textContent=format.toUpperCase()+' download started.';}catch(e){$('snippetStatus').textContent=e.message;}
 }
 async png(){
  if(!this.ready)return;const button=$('snippetPNG'),draft=structuredClone(this.draft),filename=this.filename('png');button.disabled=true;
  try{const canvas=document.createElement('canvas');paintSnippet(canvas,draft,this.layout());const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));canvas.width=canvas.height=0;if(!blob)throw new Error('The browser could not create this image. Reduce PNG scale or export SVG.');this.download(blob,filename);$('snippetStatus').textContent='PNG download started.';}catch(e){$('snippetStatus').textContent=e.message;}finally{button.disabled=false;}
 }
 async copy(text,kind){
  try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(text);$('snippetStatus').textContent=kind+' copied.';}
  catch{$('snippetCopyTitle').textContent='Copy '+kind;$('snippetCopyText').value=text;this.copyName=this.filename(kind==='HTML embed'?'html':kind==='Markdown'?'md':'txt');$('snippetCopyDialog').showModal();$('snippetCopyText').focus();$('snippetCopyText').select();}
 }
 library(){this.renderLibrary();$('snippetsDialog').showModal();$('snippetSearch').focus();}
 renderLibrary(){
  const list=$('snippetList'),query=$('snippetSearch').value.toLowerCase();list.replaceChildren();const items=this.getItems().filter(s=>(s.name+' '+s.filename+' '+s.language).toLowerCase().includes(query));
  if(!items.length){const p=document.createElement('p');p.className='muted';p.textContent=this.getItems().length?'No matching snippets.':'Select code in the editor, then choose Create snippet. Saved snippets appear here.';list.append(p);return;}
  for(const s of items){
   const row=document.createElement('div');row.className='saved-snippet';const title=document.createElement('strong');title.textContent=s.name;const meta=document.createElement('small');meta.textContent=s.language+' · '+s.raw.replace(/\r\n|\r/g,'\n').split('\n').length+' lines';row.append(title,meta);
   const controls=document.createElement('div');controls.className='snippet-library-actions';
   const button=(text,fn)=>{const b=document.createElement('button');b.textContent=text;b.setAttribute('aria-label',text+' '+s.name);b.onclick=fn;controls.append(b);return b;};
   button('Preview / export',()=>{$('snippetsDialog').close();this.show(s);});
   button('Insert',()=>{$('snippetsDialog').close();this.insert(s.raw);}).disabled=!this.hasDocument();
   button('Open as document',()=>{$('snippetsDialog').close();this.openDocument(s);});
   button('Delete',async()=>{if(await this.confirm('Delete this saved snippet?',`Remove “${s.name}” from this workspace? Source documents are unchanged. Export workspace JSON first if you want a backup.`)){this.setItems(this.getItems().filter(x=>x.id!==s.id));this.renderLibrary();}}).className='danger';
   row.append(controls);list.append(row);
  }
 }
}
