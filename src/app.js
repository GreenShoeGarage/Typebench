import {fingerprint,writeNative} from './file-io.js';
import {examples} from './examples.js';
import {MarkdownPanel} from './markdown-ui.js';
import {languageList} from './language-data.js';
// TYPEBENCH — Copyright (C) 2026 Green Shoe Garage. GPL-3.0-only.
import {VERSION,splitText,eolLabel,validPath,uniqueName,detectLanguage,decodeBytes,encodeText,validateWorkspace,WorkspaceStore} from './core.js';
import {FindPanel} from './search-ui.js';
import {runEdit,EditorView,makeState,rawText,lineBreaks,undo,redo,undoDepth,redoDepth,languageComp,appearanceComp,languageExtension,appearance} from './editor.js';
const $=id=>document.getElementById(id), mac=/Mac|iPhone|iPad/.test(navigator.platform), mod=mac?'⌘':'Ctrl+';
for(const [id,label] of languageList){const option=document.createElement('option');option.value=id;option.textContent=label;$('language').append(option);}
const languages=languageList.map(([id])=>id);
const defaultSettings={theme:'dark',fontSize:16,wrap:false,tabSize:2,sidebar:220,sidebarHidden:innerWidth<761,indentStyle:'spaces',tabIndents:false,whitespace:false,mode:'easy',previewRatio:50,syncScroll:false};
let settings={...defaultSettings}, docs=[], closed=[], activeId=null, view=null, revision=0, dirty=false, saving=false, saveTimer, blocked=false, storageUnavailable=false, booting=true, toastTimer, findPanel, markdownPanel;
const store=new WorkspaceStore('typebench:'+new URL('.',location.href).pathname);
function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);}
const current=()=>docs.find(d=>d.id===activeId);
function getRaw(d){if(d.cachedRaw===null)d.cachedRaw=rawText(d.state);return d.cachedRaw;}
function modified(d){return getRaw(d)!==d.baseRaw || d.name!==d.baseName;}
function makeDoc(data){
  const d={id:uid(),name:'untitled.txt',raw:'',language:'text',manualLanguage:false,encoding:'utf-8',bom:false,baseRaw:'',baseName:'untitled.txt',origin:'new',...data};
  d.fileHandle=null;d.diskHash=null;d.fileSaving=false;
  d.language=languages.includes(d.language)?d.language:'text';d.viewMode=['source','split','preview'].includes(d.viewMode)?d.viewMode:'source';d.manualLanguage=!!d.manualLanguage;
  d.eol=splitText(d.raw).eol;d.cachedRaw=d.raw;
  d.state=makeState(d,settings,onEditorUpdate);return d;
}
function notify(text){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,4200);}
function browserStatus(text,status='ok'){$('browserStatus').replaceChildren();const led=document.createElement('i');led.className='led '+(status==='ok'?'':status);$('browserStatus').append(led,document.createTextNode(text));}
function showError(text,conflict=false){$('bannerText').textContent=text;$('banner').hidden=false;$('reload').hidden=!conflict;$('retryStorage').hidden=!storageUnavailable;$('dismissBanner').hidden=conflict||storageUnavailable;if(conflict||storageUnavailable)browserStatus(conflict?'Conflict · export this copy':'Browser save failed','error');}
function serializeDoc(d){return {id:d.id,name:d.name,raw:getRaw(d),language:d.language,manualLanguage:d.manualLanguage,encoding:d.encoding,bom:d.bom,baseRaw:d.baseRaw,baseName:d.baseName,origin:d.origin,viewMode:d.viewMode||'source',selection:{anchor:d.state.selection.main.anchor,head:d.state.selection.main.head},scroll:d.scroll||0};}
function snapshot(){return {format:'typebench-workspace',schema:1,version:VERSION,exportedAt:new Date().toISOString(),documents:docs.map(serializeDoc),closed:closed.map(serializeDoc),activeId,settings};}
function markDirty(){if(booting)return;dirty=true;if(!blocked&&!storageUnavailable)browserStatus('Waiting to save…','pending');clearTimeout(saveTimer);saveTimer=setTimeout(persist,400);}
async function persist(){
  if(!dirty || saving || blocked || storageUnavailable)return;
  saving=true;dirty=false;browserStatus('Saving in this browser…','pending');
  try {revision=await store.write(snapshot(),revision);if(!dirty)browserStatus('Saved in this browser');}
  catch(e){dirty=true;if(e.message==='CONFLICT'){blocked=true;showError('This workspace changed in another window. Your edits are still here. Export this copy before reloading the saved workspace.',true);}else{storageUnavailable=true;showError('Browser storage could not save your work. Keep this page open and export a recovery copy. '+(e.message||''));}}
  finally {saving=false;if(dirty&&!blocked&&!storageUnavailable)saveTimer=setTimeout(persist,100);}
}
function onEditorUpdate(update){
  const d=current();if(!d)return;d.state=update.state;
  if(update.docChanged){d.cachedRaw=null;renderTabs();renderFiles();markDirty();}
  else if(update.selectionSet)markDirty();
  renderStatus();
  if(update.docChanged){markdownPanel?.schedule();findPanel?.changed();}else if(update.selectionSet)findPanel?.selectionChanged();
}
function renderStatus(){
  const d=current();for(const button of document.querySelectorAll('[data-needs-doc]'))button.disabled=!d;
  $('commandComment').disabled=!d||['text','markdown','json'].includes(d.language);
  for(const id of ['saveFile','download','undo','redo','rename','duplicate','closeDoc','findOpen'])$(id).disabled=!d;
  if(!d){$('statusLanguage').textContent='';$('fileStatus').textContent='';$('cursor').textContent='No document';$('selection').textContent='';$('eol').textContent='';$('encoding').textContent='';return;}
  $('saveFile').disabled=!!d.fileSaving;$('saveFile').textContent=d.fileSaving?'Saving…':'Save';
  const sel=d.state.selection.main,line=d.state.doc.lineAt(sel.head);
  $('statusLanguage').textContent=languageList.find(([id])=>id===d.language)?.[1]||'Plain text';
  $('cursor').textContent=`Ln ${line.number}, Col ${sel.head-line.from+1}`;
  $('selection').textContent=sel.empty?'':`${sel.to-sel.from} selected`;
  $('eol').textContent=eolLabel(d.state.field(lineBreaks),d.eol);
  $('encoding').textContent=d.encoding.toUpperCase()+(d.bom?' · BOM':'');
  $('fileStatus').textContent=d.origin==='new'?'No file copy yet':modified(d)?'File copy has changes':d.origin==='download'?'Matches last download':d.origin==='saved'?'Saved to a file':'Matches opened file';
  $('undo').disabled=undoDepth(d.state)===0;$('redo').disabled=redoDepth(d.state)===0;
}
function renderTabs(){
  const list=$('tabs');const oldScroll=list.scrollLeft;list.replaceChildren();
  for(const d of docs){const item=document.createElement('div');item.className='tab-item'+(d.id===activeId?' active':'');
    const tab=document.createElement('button');tab.id='doc-tab-'+d.id;tab.setAttribute('role','tab');tab.setAttribute('aria-controls','editorArea');tab.setAttribute('aria-selected',String(d.id===activeId));tab.tabIndex=d.id===activeId?0:-1;tab.textContent=(modified(d)?'• ':'')+d.name.split('/').pop();tab.title=d.name+(modified(d)?' — changes since file copy':'');tab.setAttribute('aria-label',d.name+(modified(d)?', modified':''));tab.onclick=()=>activate(d.id,true);
    tab.setAttribute('aria-description','Use arrow keys to switch tabs; Delete closes this document into Recently closed.');tab.onkeydown=e=>{if(e.key==='Delete'){e.preventDefault();closeDocument(d.id);$('tabs').querySelector('[aria-selected=true]')?.focus();return;}if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const i=docs.indexOf(d),n=e.key==='Home'?0:e.key==='End'?docs.length-1:(i+(e.key==='ArrowRight'?1:-1)+docs.length)%docs.length;activate(docs[n].id);$('tabs').querySelector('[aria-selected=true]')?.focus();}};
    const close=document.createElement('button');close.className='close-tab';close.textContent='×';close.setAttribute('aria-label',`Close ${d.name}`);close.setAttribute('aria-hidden','true');close.tabIndex=-1;close.onclick=()=>closeDocument(d.id);item.append(tab,close);list.append(item);
  }list.scrollLeft=oldScroll;
}
function renderFiles(){
  $('documentCount').textContent=docs.length;$('closedCount').textContent=closed.length;$('fileList').replaceChildren();
  for(const d of docs){const b=document.createElement('button');b.className='file-row'+(d.id===activeId?' active':'');b.title=d.name;b.setAttribute('aria-label',d.name);b.setAttribute('aria-current',String(d.id===activeId));
    const icon=document.createElement('span');icon.className='file-icon';icon.textContent=d.language==='markdown'?'M↓':d.language==='text'?'≡':'‹›';icon.setAttribute('aria-hidden','true');
    const name=document.createElement('span');name.className='file-name';name.textContent=d.name;b.append(icon,name);if(modified(d)){const dot=document.createElement('span');dot.className='modified';dot.textContent='•';dot.setAttribute('aria-label','modified');b.append(dot);}b.onclick=()=>{activate(d.id,true);if(innerWidth<761){settings.sidebarHidden=true;applySettings();markDirty();}};$('fileList').append(b);
  }
}
function activate(id,focus=false){
  const old=current();if(old && view)old.scroll=view.scrollDOM.scrollTop;
  activeId=id;const d=current();
  $('empty').hidden=!!d;$('editor').hidden=!d;$('documentBar').hidden=!d;
  if(d){$('editorArea').setAttribute('aria-labelledby','doc-tab-'+d.id);if(view)view.setState(d.state);else view=new EditorView({state:d.state,parent:$('editor')});$('filePath').textContent=d.name;$('language').value=d.language;requestAnimationFrame(()=>{view.scrollDOM.scrollTop=d.scroll||0;if(focus)view.focus();});document.title=d.name+' · TYPEBENCH';}
  else {if(view){view.destroy();view=null;}document.title='TYPEBENCH · Green Shoe Garage';}
  if(d)findPanel?.changed();else findPanel?.close();
  markdownPanel?.activate();
  renderTabs();renderFiles();renderStatus();$('tabs').querySelector('[aria-selected=true]')?.closest('.tab-item').scrollIntoView({block:'nearest',inline:'nearest'});markDirty();
}
function newDocument(){const name=uniqueName('untitled.txt',docs.map(d=>d.name));const d=makeDoc({name,baseName:name});docs.push(d);activate(d.id,true);}
async function openFiles(files,handles=[]){
  let last=null;const errors=[];
  for(const [index,file] of Array.from(files).entries()){try{
    if(file.size>1024*1024)notify(`Opening ${file.name} (${(file.size/1048576).toFixed(1)} MB)…`);
    const decoded=decodeBytes(await file.arrayBuffer());const name=uniqueName(validPath(file.webkitRelativePath||file.name),docs.map(d=>d.name));
    const d=makeDoc({...decoded,name,baseName:name,baseRaw:decoded.raw,origin:'opened',language:detectLanguage(name)});if(handles[index]){d.fileHandle=handles[index];d.diskHash=await fingerprint(await file.arrayBuffer());}docs.push(d);last=d.id;
  }catch(e){errors.push(file.name+': '+e.message);}}
  if(last)activate(last,true);if(errors.length)showError(errors.join(' '));$('filePicker').value='';
}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function downloadDocument(d=current()){if(!d)return;const raw=getRaw(d);downloadBlob(new Blob([encodeText(raw,d.encoding,d.bom)],{type:'application/octet-stream'}),d.name.split('/').pop());d.baseRaw=raw;d.baseName=d.name;d.origin='download';renderTabs();renderFiles();renderStatus();markDirty();notify('Download started. Check your browser’s downloads.');}
function exportWorkspace(){downloadBlob(new Blob([JSON.stringify(snapshot(),null,2)],{type:'application/json'}),'TYPEBENCH-workspace.json');notify('Workspace download started, including recently closed documents.');}
function closeDocument(id){const i=docs.findIndex(d=>d.id===id);if(i<0)return;const [d]=docs.splice(i,1);closed.push(d);if(id===activeId)activate(docs[Math.min(i,docs.length-1)]?.id||null,true);else{renderFiles();renderTabs();markDirty();}notify('Document closed. Restore it from Recently closed.');}
function rename(){const d=current();if(!d)return;$('nameInput').value=d.name;$('nameError').textContent='';$('nameDialog').showModal();$('nameInput').select();}
function duplicate(){const d=current();if(!d)return;const data=serializeDoc(d);data.id=uid();data.name=uniqueName(d.name,docs.map(x=>x.name));data.origin='new';data.baseRaw='';data.baseName=data.name;const copy=makeDoc(data);docs.push(copy);activate(copy.id,true);}
function recover(){const list=$('recoveryList');list.replaceChildren();if(!closed.length){const p=document.createElement('p');p.className='muted';p.textContent='No closed documents yet.';list.append(p);}for(const d of [...closed].reverse()){const b=document.createElement('button');b.textContent='Restore '+d.name;b.onclick=()=>{closed=closed.filter(x=>x!==d);d.name=uniqueName(d.name,docs.map(x=>x.name));docs.push(d);$('recoverDialog').close();activate(d.id,true);};list.append(b);}$('recoverDialog').showModal();}
function confirmAction(title,text){return new Promise(resolve=>{$('confirmTitle').textContent=title;$('confirmText').textContent=text;const dialog=$('confirmDialog');dialog.returnValue='cancel';dialog.addEventListener('close',()=>resolve(dialog.returnValue==='yes'),{once:true});dialog.showModal();});}
async function freshStart(){if(blocked||storageUnavailable){notify('Resolve the browser recovery warning before clearing this workspace. Export first, then retry saving or reload.');return;}if(!await confirmAction('Start with an empty workbench?','This removes open and recently closed documents from this browser workspace. Files already downloaded are not changed. Export a workspace backup first if you need these working copies.'))return;docs=[];closed=[];activate(null);await persist();}
async function importWorkspace(file){
  if(!file)return;let data;
  try{data=validateWorkspace(JSON.parse(await file.text()));}catch(e){showError('Workspace import failed: '+e.message);return;}
  if((docs.length||closed.length) && !await confirmAction('Replace this workspace?','The imported workspace will replace the open and recently closed documents here. Export the current workspace first if you want to keep it.'))return;
  try{const restored=data.documents.map(makeDoc), restoredClosed=data.closed.map(makeDoc);docs=restored;closed=restoredClosed;settings=cleanSettings(data.settings);applySettings();activate(docs.some(d=>d.id===data.activeId)?data.activeId:docs[0]?.id||null);notify('Workspace imported.');}catch(e){showError('Workspace import failed: '+e.message);}
  $('workspacePicker').value='';
}
function cleanSettings(s={}){s=s&&typeof s==='object'?s:{};return {mode:s.mode==='advanced'?'advanced':'easy',previewRatio:Math.max(25,Math.min(75,+s.previewRatio||50)),syncScroll:!!s.syncScroll,indentStyle:s.indentStyle==='tabs'?'tabs':'spaces',tabIndents:!!s.tabIndents,whitespace:!!s.whitespace,theme:['dark','light','contrast'].includes(s.theme)?s.theme:'dark',fontSize:[14,16,18,20,24].includes(+s.fontSize)?+s.fontSize:16,tabSize:[2,4,8].includes(+s.tabSize)?+s.tabSize:2,wrap:!!s.wrap,sidebar:Math.max(160,Math.min(380,+s.sidebar||220)),sidebarHidden:typeof s.sidebarHidden==='boolean'?s.sidebarHidden:innerWidth<761};}
function applySettings(){
  document.body.dataset.mode=settings.mode;$('modeToggle').textContent=settings.mode==='advanced'?'Advanced':'Easy';$('modeToggle').setAttribute('aria-pressed',String(settings.mode==='advanced'));
  document.documentElement.dataset.theme=settings.theme;document.documentElement.style.setProperty('--font-size',settings.fontSize+'px');document.documentElement.style.setProperty('--sidebar',settings.sidebar+'px');document.body.classList.toggle('sidebar-hidden',settings.sidebarHidden);$('sidebarToggle').setAttribute('aria-expanded',String(!settings.sidebarHidden));$('sidebarDivider').setAttribute('aria-valuenow',settings.sidebar);$('theme').value=settings.theme;$('fontSize').value=settings.fontSize;$('wrap').checked=settings.wrap;$('tabSize').value=settings.tabSize;$('indentStyle').value=settings.indentStyle;$('tabIndents').checked=settings.tabIndents;$('whitespace').checked=settings.whitespace;
  for(const d of [...docs,...closed]) {const spec={effects:appearanceComp.reconfigure(appearance(settings))};if(d.id===activeId&&view)view.dispatch(spec);else d.state=d.state.update(spec).state;}
  markdownPanel?.layout();view?.requestMeasure();
}
$('new').onclick=$('emptyNew').onclick=newDocument;$('emptyMarkdown').onclick=newMarkdown;$('open').onclick=$('emptyOpen').onclick=()=>$('filePicker').click();$('filePicker').onchange=e=>openFiles(e.target.files);
$('download').onclick=()=>downloadDocument();$('saveFile').onclick=()=>saveDocument();$('backup').onclick=$('emergencyExport').onclick=$('confirmBackup').onclick=exportWorkspace;
$('importWorkspace').onclick=()=>$('workspacePicker').click();$('workspacePicker').onchange=e=>importWorkspace(e.target.files[0]);
$('undo').onclick=()=>{if(view){undo(view);view.focus();}};$('redo').onclick=()=>{if(view){redo(view);view.focus();}};
$('actionsOpen').onclick=openCommands;$('settingsOpen').onclick=()=>$('settingsDialog').showModal();$('helpOpen').onclick=()=>$('helpDialog').showModal();
for(const [id,fn] of [['rename',rename],['duplicate',duplicate],['closeDoc',()=>closeDocument(activeId)],['fresh',freshStart]])$(id).onclick=()=>{$('actionsDialog').close();fn();};
$('modeToggle').onclick=()=>{settings.mode=settings.mode==='easy'?'advanced':'easy';applySettings();markDirty();};
$('examplesOpen').onclick=()=>$('examplesDialog').showModal();
$('recover').onclick=recover;$('reload').onclick=()=>{if(confirm('Reload the saved workspace? Export the edits in this window first if you need to keep them.')){dirty=false;blocked=false;storageUnavailable=false;location.reload();}};
$('nameForm').onsubmit=e=>{e.preventDefault();try{const name=validPath($('nameInput').value),d=current();if(docs.some(x=>x.id!==d.id&&x.name===name))throw new Error('An open document already uses that path.');if(d.name!==name){d.fileHandle=null;d.diskHash=null;}d.name=name;if(!d.manualLanguage){d.language=detectLanguage(name);view.dispatch({effects:languageComp.reconfigure(languageExtension(d.language))});}$('nameDialog').close();activate(d.id,true);}catch(e){$('nameError').textContent=e.message;}};
$('language').onchange=()=>{const d=current();d.language=$('language').value;d.manualLanguage=true;view.dispatch({effects:languageComp.reconfigure(languageExtension(d.language))});renderFiles();markdownPanel?.activate();markDirty();};
for(const el of document.querySelectorAll('[data-close]'))el.onclick=()=>el.closest('dialog').close();
for(const id of ['theme','fontSize','wrap','tabSize','indentStyle','tabIndents','whitespace'])$(id).onchange=()=>{settings[id]=['wrap','tabIndents','whitespace'].includes(id)?$(id).checked:['fontSize','tabSize'].includes(id)?+$(id).value:$(id).value;applySettings();markDirty();};
$('themeQuick').onclick=()=>{const themes=['dark','light','contrast'];settings.theme=themes[(themes.indexOf(settings.theme)+1)%3];applySettings();markDirty();};
$('sidebarToggle').onclick=()=>{settings.sidebarHidden=!settings.sidebarHidden;applySettings();markDirty();};
$('sidebarDivider').onpointerdown=e=>{e.preventDefault();const el=e.currentTarget;el.setPointerCapture(e.pointerId);const move=e=>{settings.sidebar=Math.min(380,Math.max(160,e.clientX));applySettings();};el.onpointermove=move;el.onpointerup=()=>{el.onpointermove=null;markDirty();};};
$('sidebarDivider').onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();settings.sidebar=Math.max(160,Math.min(380,settings.sidebar+(e.key==='ArrowRight'?10:-10)));applySettings();markDirty();}};
function shortcut(value){return value.split(' / ').map(key=>mod+(mac?key.replaceAll('Alt+','⌥').replaceAll('Shift+','⇧'):key)).join(' / ');}
for(const el of document.querySelectorAll('[data-key]'))el.textContent=shortcut(el.dataset.key);
for(const el of document.querySelectorAll('[data-shortcut]'))el.textContent=shortcut(el.dataset.shortcut);
if(mac){for(const el of document.querySelectorAll('kbd:not([data-key]),.keys dd:not([data-shortcut])'))el.textContent=el.textContent.replaceAll('Alt+','⌥').replaceAll('Shift+','⇧');}
document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]'))return;const m=mac?e.metaKey:e.ctrlKey;if(m&&e.key.toLowerCase()==='s'){e.preventDefault();saveDocument(e.shiftKey);}else if(m&&e.key.toLowerCase()==='o'){e.preventDefault();$('filePicker').click();}else if(m&&e.altKey&&e.key.toLowerCase()==='n'){e.preventDefault();newDocument();}else if(m&&e.shiftKey&&e.key.toLowerCase()==='p'){e.preventDefault();openCommands();}else if(m&&e.key.toLowerCase()==='f'){e.preventDefault();openFind();}else if(m&&e.key.toLowerCase()==='g'){e.preventDefault();openGoto();}else if(e.key==='Escape'&&findPanel.showing){findPanel.close();}else if(e.key==='F2'&&current()){e.preventDefault();rename();}});

function openCommands(){renderStatus();$('commandQuery').value='';filterCommands();$('actionsDialog').showModal();$('commandQuery').focus();}
function filterCommands(){const tokens=$('commandQuery').value.toLowerCase().trim().split(/\s+/).filter(Boolean);let shown=0;for(const b of $('commandList').querySelectorAll('button')){b.hidden=!tokens.every(t=>b.textContent.toLowerCase().includes(t));if(!b.hidden)shown++;}$('commandEmpty').hidden=shown>0;}
$('commandQuery').oninput=filterCommands;
$('actionsDialog').addEventListener('keydown',e=>{const buttons=[...$('commandList').querySelectorAll('button:not([hidden]):not(:disabled)')];const i=buttons.indexOf(document.activeElement);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const next=e.key==='ArrowDown'?(i+1)%buttons.length:i<=0?buttons.length-1:i-1;buttons[next]?.focus();}else if(e.key==='Enter'&&document.activeElement===$('commandQuery')){e.preventDefault();buttons[0]?.click();}});
function ensureSource(){const d=current();if(d?.language==='markdown'&&d.viewMode==='preview'){d.viewMode='split';markdownPanel.layout();markDirty();}}
function openFind(){ensureSource();findPanel.open();}
function openGoto(){if(!view)return;ensureSource();const line=view.state.doc.lineAt(view.state.selection.main.head).number;$('gotoInput').value=String(line);$('gotoHint').textContent=`${view.state.doc.lines.toLocaleString()} lines in this document.`;$('gotoError').textContent='';$('gotoDialog').showModal();$('gotoInput').select();}
$('gotoForm').onsubmit=e=>{e.preventDefault();const input=$('gotoInput').value.trim();const m=/^(\d+)(?::(\d+))?$/.exec(input);if(!m||+m[1]<1||+m[1]>view.state.doc.lines){$('gotoError').textContent=`Enter a line from 1 to ${view.state.doc.lines.toLocaleString()}, optionally followed by :column.`;return;}const line=view.state.doc.line(+m[1]),col=m[2]?+m[2]:1;if(col<1||col>line.length+1){$('gotoError').textContent=`This line has columns 1 through ${line.length+1}.`;return;}const pos=line.from+col-1;view.dispatch({selection:{anchor:pos},effects:EditorView.scrollIntoView(pos,{y:'center'})});$('gotoDialog').close();view.focus();};
const editButtons={commandIndent:'indent',commandOutdent:'outdent',commandComment:'comment',commandDuplicateLine:'duplicateLine',commandMoveUp:'moveUp',commandMoveDown:'moveDown'};
for(const [id,name] of Object.entries(editButtons))$(id).onclick=()=>{$('actionsDialog').close();if(view){ensureSource();if(!runEdit(view,name))notify('That command is not available here.');view.focus();}};
const actions={commandNew:newDocument,commandNewMarkdown:newMarkdown,commandDetect:detectCurrent,commandOpen:()=>$('filePicker').click(),commandDownload:()=>downloadDocument(),commandSave:()=>saveDocument(),commandSaveAs:()=>saveDocument(true),commandDirectOpen:openNative,commandZip:exportZIP,commandExamples:()=>$('examplesDialog').showModal(),commandOffline:checkOffline,commandFind:()=>openFind(),gotoOpen:openGoto,commandRecover:recover,commandBackup:exportWorkspace,commandImport:()=>$('workspacePicker').click(),commandSettings:()=>$('settingsDialog').showModal(),commandWrap:()=>{settings.wrap=!settings.wrap;applySettings();markDirty();},commandWhitespace:()=>{settings.whitespace=!settings.whitespace;applySettings();markDirty();}};
for(const [id,fn] of Object.entries(actions))$(id).onclick=()=>{$('actionsDialog').close();fn();};
markdownPanel=new MarkdownPanel({getView:()=>view,getDoc:current,getSettings:()=>settings,changed:markDirty,notify,download:downloadBlob,confirm:confirmAction});
findPanel=new FindPanel(()=>view,notify);$('findOpen').onclick=()=>openFind();

let dragCounter=0;document.addEventListener('dragenter',e=>{if(e.dataTransfer.types.includes('Files')){e.preventDefault();dragCounter++;$('dropOverlay').hidden=false;}});document.addEventListener('dragover',e=>{if(e.dataTransfer.types.includes('Files'))e.preventDefault();});document.addEventListener('dragleave',()=>{if(--dragCounter<=0){dragCounter=0;$('dropOverlay').hidden=true;}});document.addEventListener('drop',e=>{if(!e.dataTransfer.files.length)return;e.preventDefault();dragCounter=0;$('dropOverlay').hidden=true;openFiles(e.dataTransfer.files);});
window.addEventListener('resize',()=>requestAnimationFrame(()=>{$('tabs').querySelector('[aria-selected=true]')?.closest('.tab-item').scrollIntoView({block:'nearest',inline:'nearest'});view?.requestMeasure();}));
window.addEventListener('beforeunload',e=>{if(dirty||saving||blocked||storageUnavailable||docs.some(d=>d.fileSaving)){e.preventDefault();e.returnValue='';}});document.addEventListener('visibilitychange',()=>{if(document.hidden)persist();});
function newMarkdown(){const name=uniqueName('untitled.md',docs.map(d=>d.name));const d=makeDoc({name,baseName:name,language:'markdown',viewMode:'split'});docs.push(d);activate(d.id,true);}
function detectCurrent(){const d=current();if(!d)return;d.language=detectLanguage(d.name);d.manualLanguage=false;view.dispatch({effects:languageComp.reconfigure(languageExtension(d.language))});$('language').value=d.language;renderFiles();markdownPanel.activate();markDirty();}
$('dismissBanner').onclick=()=>$('banner').hidden=true;
$('retryStorage').onclick=async()=>{try{store.db?.close();await store.open();storageUnavailable=false;dirty=true;await persist();if(!storageUnavailable&&!blocked){$('banner').hidden=true;notify('Browser recovery is working again.');}}catch(e){storageUnavailable=true;showError('Browser recovery is still unavailable. Export a recovery copy. '+e.message);}};
async function openNative(){
 if(!window.showOpenFilePicker){$('filePicker').click();notify('Direct file access is unavailable here. Open a copy and use Download.');return;}
 try{const handles=await window.showOpenFilePicker({multiple:true});const files=await Promise.all(handles.map(h=>h.getFile()));await openFiles(files,handles);}catch(e){if(e.name!=='AbortError')showError('Could not open files for direct saving. Use Open files instead. '+e.message);}
}
async function saveDocument(forceAs=false){
 const d=current();if(!d||d.fileSaving)return;
 if(!window.showSaveFilePicker){downloadDocument(d);return;}
 d.fileSaving=true;renderStatus();
 try{
  const existing=!forceAs&&d.fileHandle;const handle=existing?d.fileHandle:await window.showSaveFilePicker({suggestedName:d.name.split('/').pop()});
  const raw=getRaw(d),bytes=encodeText(raw,d.encoding,d.bom),name=d.name;const chosenName=existing?name:validPath(name.slice(0,name.lastIndexOf('/')+1)+handle.name);
  const hash=await writeNative(handle,bytes,existing?d.diskHash:null,()=>confirmAction('File changed outside TYPEBENCH','The file on disk changed after it was opened or saved here. Continuing replaces those disk edits with this document. Cancel and use Save as or Download to keep both copies.'));
  if(hash===null){notify('Save cancelled. The file on disk was not changed.');return;}
  d.fileHandle=d.name===name?handle:null;d.diskHash=d.name===name?hash:null;d.baseRaw=raw;d.baseName=name;d.origin='saved';
  if(!existing&&d.name===name){d.name=uniqueName(chosenName,docs.filter(x=>x!==d).map(x=>x.name));d.baseName=d.name;if(!d.manualLanguage){d.language=detectLanguage(d.name);const spec={effects:languageComp.reconfigure(languageExtension(d.language))};if(d===current()){view.dispatch(spec);$('filePath').textContent=d.name;$('language').value=d.language;markdownPanel.activate();}else d.state=d.state.update(spec).state;}}if(d===current()){$('filePath').textContent=d.name;document.title=d.name+' · TYPEBENCH';}markDirty();notify('Saved to '+handle.name+'.');
 }catch(e){if(e.name!=='AbortError')showError('Could not save to the file. Your working copy is still here; use Download or Export recovery copy. '+e.message);}
 finally{d.fileSaving=false;renderTabs();renderFiles();renderStatus();}
}
function exportZIP(){
 if(!docs.length){notify('Open or create a document before exporting a ZIP.');return;}
 let worker;try{worker=new Worker(new URL('./assets/zip-worker.js',document.baseURI));}catch{showError('ZIP export requires HTTPS or localhost. Export workspace JSON here, or serve the app locally.');return;}$('zipProgress').textContent='Preparing workspace documents…';$('zipDialog').showModal();
 const cancel=()=>{worker.terminate();$('zipDialog').removeEventListener('close',cancel);};$('zipDialog').addEventListener('close',cancel);
 worker.onmessage=({data})=>{if(data.error){$('zipDialog').close();showError('ZIP export failed: '+data.error);return;}if(data.done){downloadBlob(new Blob([data.bytes],{type:'application/zip'}),'TYPEBENCH-documents.zip');$('zipDialog').close();notify('ZIP exported with open documents and their relative paths.');}else $('zipProgress').textContent=`Packing ${data.progress} of ${data.total} documents…`;};
 worker.onerror=()=>{$('zipDialog').close();showError('ZIP export could not finish. Export workspace JSON to keep a recovery copy.');};worker.postMessage({documents:docs.map(serializeDoc)});
}
for(const b of document.querySelectorAll('[data-example]'))b.onclick=()=>{const kind=b.dataset.example,data=examples[kind],name=uniqueName(data.name,docs.map(d=>d.name));const d=makeDoc({...data,name,baseName:name,language:kind,viewMode:kind==='markdown'?'split':'source'});docs.push(d);$('examplesDialog').close();activate(d.id,true);};
let swRegistration;
async function checkOffline(){if(!swRegistration){notify('Offline setup requires HTTPS or localhost. See Help for setup.');return;}try{await swRegistration.update();notify(swRegistration.waiting?'Update ready. Save your work, close all TYPEBENCH windows, then reopen.':'Update check finished. A notice will appear if a new version installs.');}catch{notify('Update check needs a network connection. Your installed copy is still available.');}}
async function init(){
  try{await store.open();const saved=await store.read();if(saved){const data=validateWorkspace(saved.data);revision=saved.revision;settings=cleanSettings(data.settings);docs=data.documents.map(makeDoc);closed=data.closed.map(makeDoc);activeId=data.activeId;}browserStatus('Saved in this browser');}
  catch(e){storageUnavailable=true;showError('Browser recovery is unavailable. You can still edit and download. Export a workspace before leaving this page. '+e.message);}
  applySettings();activate(docs.some(d=>d.id===activeId)?activeId:docs[0]?.id||null);booting=false;
  if('serviceWorker' in navigator && ['https:','http:'].includes(location.protocol)){
    try{const reg=swRegistration=await navigator.serviceWorker.register('./sw.js');const showOffline=()=>{const owns=navigator.serviceWorker.controller?.scriptURL===new URL('./sw.js',location.href).href;$('offline').textContent=owns?'Offline ready':reg.installing?.state==='redundant'?'Offline setup failed':'Preparing offline…';$('updateNotice').hidden=!reg.waiting;};
      const observe=()=>{const worker=reg.installing;if(worker)worker.addEventListener('statechange',()=>{showOffline();if(worker.state==='redundant'&&!navigator.serviceWorker.controller){$('offline').textContent='Offline setup failed';$('offline').title='One or more assets could not be cached. Reload online after checking the complete deployment.';}});};
      reg.addEventListener('updatefound',observe);navigator.serviceWorker.addEventListener('controllerchange',showOffline);observe();showOffline();}

    catch{$('offline').textContent='Online setup needed';$('offline').title='Offline reload is unavailable here. Serve over HTTPS or localhost.';}
  }else{$('offline').textContent='Local folder mode';}
}
init();
