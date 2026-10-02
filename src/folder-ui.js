// TYPEBENCH — GPL-3.0-only. Transactional folder operations on local working copies.
import {allFolders,ancestors,within,basename,parentPath,availablePath,assertAvailable,planFolderMove} from './folder-data.js';
import {validPath,decodeBytes,detectLanguage} from './core.js';
import {pickerRoots,droppedRoots,binaryFile,checkCancelled,interruptible,yieldToUI} from './folder-import.js';
const $=id=>document.getElementById(id);
export class FolderWorkspace{
 constructor({state,commit,makeDoc,uid,notify,confirm,download}){
  Object.assign(this,{state,commit,makeDoc,uid,notify,confirm,download});this.controller=null;this.importBase='';
  $('folderNameForm').onsubmit=e=>{e.preventDefault();try{this.submitName();$('folderNameDialog').close();}catch(e){$('folderNameError').textContent=e.message;}};
  $('folderPicker').onchange=e=>{const files=Array.from(e.target.files);e.target.value='';if(!files.length){this.notify('No files were provided. Use + Folder to create an empty folder, or drop it here if your browser supports directory drops.');return;}if(!files.some(f=>f.webkitRelativePath)){this.notify('This browser did not provide relative folder paths. Try a directory drop or use Open files.');return;}this.import(()=>Promise.resolve(pickerRoots(files)),this.importBase,'Folder picker');};
  $('folderImportCancel').onclick=()=>this.controller?.abort();
  $('folderImportDone').onclick=$('folderImportClose').onclick=()=>$('folderImportDialog').close();
  $('folderImportDialog').addEventListener('cancel',e=>{if(this.controller){e.preventDefault();this.controller.abort();}});
  $('folderImportDownload').onclick=()=>this.download(new Blob([this.report||''],{type:'text/plain;charset=utf-8'}),'TYPEBENCH-folder-import.txt');
 }
 name(from=null,parent=''){
  this.renameFrom=from;$('folderNameTitle').textContent=from?'Rename / move folder':'Create folder';$('folderNameSubmit').textContent=from?'Apply':'Create';$('folderNameInput').value=from||((parent?parent+'/':'')+'new-folder');$('folderNameError').textContent='';$('folderNameDialog').showModal();$('folderNameInput').select();
 }
 submitName(){
  const s=this.state(),path=validPath($('folderNameInput').value),names=s.docs.map(d=>d.name),dirs=allFolders(names,s.folders);
  if(this.renameFrom){
   if(!dirs.includes(this.renameFrom))throw new Error('That folder is no longer in the workspace.');
   const plan=planFolderMove(this.renameFrom,path,names,dirs),map=p=>within(p,this.renameFrom)?path+p.slice(this.renameFrom.length):p;
   s.docs.forEach((d,i)=>{if(d.name!==plan.files[i]){d.name=plan.files[i];d.fileHandle=null;d.diskHash=null;}});
   this.commit({folders:plan.folders,collapsedFolders:new Set([...s.collapsedFolders].map(map))});this.notify('Folder path updated. Files on disk are unchanged.');
  }else{assertAvailable(path,'folder',names,dirs);const collapsedFolders=new Set(s.collapsedFolders);for(const parent of ancestors(path))collapsedFolders.delete(parent);this.commit({folders:allFolders(names,[...dirs,path]),collapsedFolders});this.notify('Folder created.');}
 }
 async remove(path){
  let s=this.state();if(!allFolders(s.docs.map(d=>d.name),s.folders).includes(path))return;
  const count=s.docs.filter(d=>within(d.name,path)).length;
  if(!await this.confirm('Delete this folder from the workspace?',`Move “${path}” and its ${count} file${count===1?'':'s'} to Recently closed? Files on your device are unchanged. You can restore the folder together.`))return;
  s=this.state();const removed=s.docs.filter(d=>within(d.name,path)),ids=new Set(removed.map(d=>d.id)),folders=allFolders(s.docs.map(d=>d.name),s.folders),record={id:this.uid(),path,folders:folders.filter(p=>within(p,path)),documentIds:[...ids]};
  this.commit({docs:s.docs.filter(d=>!ids.has(d.id)),closed:[...s.closed,...removed],folders:folders.filter(p=>!within(p,path)),closedFolders:[...s.closedFolders,record],collapsedFolders:new Set([...s.collapsedFolders].filter(p=>!within(p,path)))});
  this.notify('Folder moved to Recently closed. Restore it there.');
 }
 restore(record){
  const s=this.state(),names=s.docs.map(d=>d.name),dirs=allFolders(names,s.folders),path=availablePath(record.path,'folder',names,dirs),ids=new Set(record.documentIds),restored=s.closed.filter(d=>ids.has(d.id));
  const folders=allFolders(names,[...dirs,...record.folders.map(p=>path+p.slice(record.path.length))]);
  for(const d of restored){const name=availablePath(path+d.name.slice(record.path.length),'file',names,folders);if(name!==d.name){d.name=name;d.fileHandle=null;d.diskHash=null;}names.push(name);}
  const collapsedFolders=new Set(s.collapsedFolders);for(const p of ancestors(path))collapsedFolders.delete(p);collapsedFolders.delete(path);
  this.commit({docs:[...s.docs,...restored],closed:s.closed.filter(d=>!ids.has(d.id)),folders,closedFolders:s.closedFolders.filter(g=>g.id!==record.id),collapsedFolders},restored[0]?.id);
  this.notify(path===record.path?'Folder restored.':'Folder restored as '+path+' to avoid a collision.');
 }
 choose(parent=''){
  if(!('webkitdirectory' in $('folderPicker'))){this.notify('This browser does not support a folder picker. Try dropping a folder or use Open files.');return;}
  this.importBase=typeof parent==='string'?parent:'';$('folderPicker').click();
 }
 drop(sources){return this.import(options=>droppedRoots(sources,options),'','Dropped folder');}
 async import(scan,base='',source='Folder import'){
  if(this.controller){this.notify('Finish or cancel the current import first.');return;}
  if(document.querySelector('dialog[open]')){this.notify('Close the current dialog before importing a folder.');return;}
  const controller=this.controller=new AbortController(),signal=controller.signal;let read=0,total=0,bytes=0;const issues=[],renames=[];
  $('folderImportTitle').textContent='Importing folder';$('folderImportStatus').textContent='Scanning folders…';$('folderImportProgress').removeAttribute('value');$('folderImportProgress').hidden=false;$('folderImportCancel').hidden=false;for(const id of ['folderImportDone','folderImportClose','folderImportDownload','folderImportDetails'])$(id).hidden=true;$('folderImportLog').textContent='';$('folderImportDialog').showModal();
  try{
   const roots=await scan({signal,onProgress:(count,path)=>{$('folderImportStatus').textContent=`Scanning ${count.toLocaleString()} entries · ${path}`;}});checkCancelled(signal);total=roots.reduce((n,r)=>n+r.files.length,0);
   const staged=[];
   for(const root of roots){issues.push(...root.errors);const ready={...root,files:[]};staged.push(ready);
    for(const item of root.files){checkCancelled(signal);$('folderImportStatus').textContent=`Reading ${++read} of ${total} · ${item.path}`;$('folderImportProgress').max=total||1;$('folderImportProgress').value=read;
     try{if(validPath(item.path)!==item.path)throw new Error('Unsupported relative path.');const file=await interruptible(item.getFile(),signal);if(binaryFile(file))throw new Error('Binary format: text and code files only.');const buffer=await interruptible(file.arrayBuffer(),signal);const decoded=decodeBytes(buffer);ready.files.push({path:item.path,...decoded});bytes+=buffer.byteLength;}
     catch(e){if(e.name==='AbortError')throw e;issues.push({path:item.path,reason:e.message});}
     if(read%10===0)await yieldToUI();
    }
   }
   await yieldToUI();checkCancelled(signal);$('folderImportStatus').textContent='Adding working copies…';
   // Resolve against the current namespace only after all async reads. Commit once.
   const s=this.state(),names=s.docs.map(d=>d.name),folders=allFolders(names,s.folders),documents=[];const initialFolders=new Set(folders);
   if(base&&!folders.includes(base))throw new Error('The destination folder is no longer available. Import again.');
   for(const root of staged){const map=new Map();
    for(const original of [...root.folders].sort((a,b)=>a.split('/').length-b.split('/').length||a.localeCompare(b))){
     try{if(validPath(original)!==original)throw new Error('Unsupported folder name.');const parent=parentPath(original);if(parent&&!map.has(parent))continue;const wanted=(parent?map.get(parent)+'/':base?base+'/':'')+basename(original),actual=availablePath(wanted,'folder',names,folders);map.set(original,actual);folders.push(actual);if(actual!==wanted)renames.push(wanted+' → '+actual);}
     catch(e){issues.push({path:original,reason:e.message});}
    }
    for(const file of root.files){const parent=parentPath(file.path);if(parent&&!map.has(parent)){issues.push({path:file.path,reason:'Parent folder could not be imported.'});continue;}
     const wanted=(parent?map.get(parent)+'/':base?base+'/':'')+basename(file.path),name=availablePath(wanted,'file',names,folders);if(name!==wanted)renames.push(wanted+' → '+name);
     const d=this.makeDoc({...file,name,baseName:name,baseRaw:file.raw,origin:'opened',language:detectLanguage(name)});documents.push(d);names.push(name);
    }
   }
   const addedFolders=folders.filter(p=>!initialFolders.has(p)),collapsedFolders=new Set(s.collapsedFolders);
   for(const p of addedFolders)if(parentPath(p))collapsedFolders.add(p);
   if(documents.length)for(const p of ancestors(documents[0].name))collapsedFolders.delete(p);
   this.commit({docs:[...s.docs,...documents],folders:allFolders(names,folders),collapsedFolders},documents[0]?.id);
   const summary=`Imported ${documents.length.toLocaleString()} text file${documents.length===1?'':'s'} and ${addedFolders.length.toLocaleString()} folder${addedFolders.length===1?'':'s'}. ${issues.length?issues.length+' item(s) skipped or unreadable.':'No files skipped.'}`;
   this.report=`TYPEBENCH folder import\n${source}\n${new Date().toISOString()}\n\n${summary}\n${bytes.toLocaleString()} source bytes read.\n\n${renames.length?'Collision renames:\n'+renames.join('\n')+'\n\n':''}${issues.length?'Skipped / unreadable:\n'+issues.map(i=>i.path+': '+i.reason).join('\n'):'All exposed text files imported.'}\n\nFolder picker APIs do not expose empty directories. Directory drops preserve empty folders when the browser exposes them.\n`;
   $('folderImportTitle').textContent='Folder import complete';$('folderImportStatus').textContent=summary;
   if(renames.length||issues.length){$('folderImportDetails').hidden=false;$('folderImportSummary').textContent=`${renames.length} collision rename(s) · ${issues.length} issue(s)`;$('folderImportLog').textContent=this.report;}
  }catch(e){const cancelled=e.name==='AbortError';$('folderImportTitle').textContent=cancelled?'Import cancelled':'Import could not finish';$('folderImportStatus').textContent=cancelled?'No files or folders were added.':e.message+' No staged files were added.';this.report=$('folderImportStatus').textContent;}
  finally{this.controller=null;$('folderImportProgress').hidden=true;$('folderImportCancel').hidden=true;for(const id of ['folderImportDone','folderImportClose','folderImportDownload'])$(id).hidden=false;$('folderImportDone').focus();}
 }
}
