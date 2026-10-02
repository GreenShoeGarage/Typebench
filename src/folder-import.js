// TYPEBENCH — GPL-3.0-only. Browser-granted directory entries are read locally.
import {languageList} from './language-data.js';
import {ancestors} from './folder-data.js';
export function checkCancelled(signal){if(signal?.aborted)throw new DOMException('Import cancelled','AbortError');}
export async function interruptible(promise,signal){
 checkCancelled(signal);let abort;
 try{return await Promise.race([promise,new Promise((_,reject)=>{abort=()=>reject(new DOMException('Import cancelled','AbortError'));signal?.addEventListener('abort',abort,{once:true});})]);}
 finally{signal?.removeEventListener('abort',abort);}
}
export const yieldToUI=()=>new Promise(r=>setTimeout(r,0));
export function captureDrop(data){
 const sources=[];
 // Capture every capability synchronously inside drop, before the data store is protected.
 for(const item of Array.from(data.items||[]))if(item.kind==='file'){
  let entry=null,promise=null,file=null;try{entry=(item.getAsEntry||item.webkitGetAsEntry)?.call(item);}catch{}
  if(!entry&&item.getAsFileSystemHandle)try{promise=item.getAsFileSystemHandle().then(handle=>({handle}),error=>({error}));}catch{}
  try{file=item.getAsFile();}catch{}sources.push({entry,promise,file});
 }
 if(!sources.length)for(const file of Array.from(data.files||[]))sources.push({file});
 return sources;
}
export function pickerRoots(files){
 const roots=new Map();
 for(const file of Array.from(files)){
  const path=file.webkitRelativePath||file.name,name=path.split('/')[0],key=path.includes('/')?name:path;
  if(!roots.has(key))roots.set(key,{name,directory:path.includes('/'),folders:new Set(),files:[],errors:[]});
  const root=roots.get(key);for(const p of ancestors(path))root.folders.add(p);root.files.push({path,getFile:()=>Promise.resolve(file)});
 }
 return [...roots.values()];
}
export async function droppedRoots(sources,{signal,onProgress=()=>{}}={}){
 const roots=[];let count=0;
 async function visit(node,path,root,isHandle=false){
  checkCancelled(signal);if(++count%50===0){onProgress(count,path);await yieldToUI();}checkCancelled(signal);
  const directory=isHandle?node.kind==='directory':node.isDirectory;
  if(directory){
   root.folders.add(path);
   try{
    if(isHandle){const iterator=node.values();while(true){const next=await interruptible(iterator.next(),signal);if(next.done)break;await visit(next.value,path+'/'+next.value.name,root,true);}}
    else{const reader=node.createReader();while(true){const entries=await interruptible(new Promise((resolve,reject)=>reader.readEntries(resolve,reject)),signal);if(!entries.length)break;for(const entry of entries)await visit(entry,path+'/'+entry.name,root);}}
   }catch(e){if(e.name==='AbortError')throw e;root.errors.push({path,reason:'Folder could not be read: '+e.message});}
  }else root.files.push({path,getFile:isHandle?()=>node.getFile():()=>new Promise((resolve,reject)=>node.file(resolve,reject))});
 }
 for(const source of sources){
  checkCancelled(signal);const result=source.promise?await interruptible(source.promise,signal):null,node=source.entry||result?.handle;
  if(node){const root={name:node.name,directory:!!node.isDirectory||node.kind==='directory',folders:new Set(),files:[],errors:[]};roots.push(root);await visit(node,node.name,root,!source.entry);}
  else if(source.file)roots.push(...pickerRoots([source.file]));
  else roots.push({name:'Dropped item',directory:false,folders:new Set(),files:[],errors:[{path:'Dropped item',reason:result?.error?.message||'This browser did not expose the dropped folder. Use Import folder instead.'}]});
 }
 onProgress(count,'Scan complete');return roots;
}
export function binaryFile(file){
 const ext=file.name.split('.').pop().toLowerCase();
 if(languageList.some(([,label,extensions])=>extensions.includes(ext)))return false;
 return /^(image|audio|video|font)\//.test(file.type)||['pdf','zip','gz','7z','rar','tar','png','jpg','jpeg','gif','webp','ico','bmp','tif','tiff','heic','mp3','wav','mp4','mov','woff','woff2','ttf','otf','exe','dll','so','dylib','o','a','class','pyc','wasm','doc','docx','xls','xlsx','ppt','pptx','sqlite','db'].includes(ext);
}
