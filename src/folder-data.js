// TYPEBENCH — GPL-3.0-only. Relative workspace paths, never native disk mutations.
import {validPath} from './paths.js';
export const within=(path,parent)=>path===parent||path.startsWith(parent+'/');
export const parentPath=path=>path.includes('/')?path.slice(0,path.lastIndexOf('/')):'';
export const basename=path=>path.split('/').pop();
export function ancestors(path){const parts=path.split('/'),out=[];for(let i=1;i<parts.length;i++)out.push(parts.slice(0,i).join('/'));return out;}
export function allFolders(files,explicit=[]){const set=new Set(explicit);for(const path of [...files,...explicit])for(const parent of ancestors(path))set.add(parent);return [...set].sort();}
export function validateFolderData(data){
 const list=value=>{if(value===undefined)return [];if(!Array.isArray(value)||value.some(p=>typeof p!=='string'||validPath(p)!==p)||new Set(value).size!==value.length)throw new Error('The workspace contains invalid folder paths.');return value;};
 const folders=list(data.folders),collapsedFolders=list(data.collapsedFolders);
 const closedFolders=data.closedFolders??[];if(!Array.isArray(closedFolders))throw new Error('Invalid folder recovery data.');
 const ids=new Set(),recoveredIds=new Set();
 for(const g of closedFolders){if(!g||typeof g.id!=='string'||ids.has(g.id)||typeof g.path!=='string'||validPath(g.path)!==g.path||!Array.isArray(g.documentIds)||g.documentIds.some(id=>typeof id!=='string')||new Set(g.documentIds).size!==g.documentIds.length)throw new Error('Invalid folder recovery data.');ids.add(g.id);if(g.documentIds.some(id=>recoveredIds.has(id)||!data.closed?.some(d=>d.id===id&&within(d.name,g.path))))throw new Error('Recovered folder files do not match their paths.');for(const id of g.documentIds)recoveredIds.add(id);list(g.folders);if(!Array.isArray(g.folders)||!g.folders.includes(g.path)||g.folders.some(p=>!within(p,g.path)))throw new Error('Invalid recovered folder hierarchy.');}
 return {folders:[...folders],collapsedFolders:[...collapsedFolders],closedFolders:closedFolders.map(g=>({id:g.id,path:g.path,folders:[...g.folders],documentIds:[...g.documentIds]}))};
}
export function assertAvailable(path,kind,files,folders){
 validPath(path);const knownFolders=allFolders(files,folders);for(const parent of ancestors(path)){const actual=knownFolders.find(p=>p.toLowerCase()===parent.toLowerCase());if(actual&&actual!==parent)throw new Error('Use the existing folder spelling: '+actual);}
 const key=path.toLowerCase(),fileSet=new Set(files.map(p=>p.toLowerCase())),folderSet=new Set(allFolders(files,folders).map(p=>p.toLowerCase()));
 if(fileSet.has(key)||folderSet.has(key)||ancestors(path).some(p=>fileSet.has(p.toLowerCase())))throw new Error('That path conflicts with an existing file or folder. Choose another path.');
 return path;
}
export function availablePath(path,kind,files,folders){
 // Repair conflicting ancestor names when importing or restoring a relative path.
 const knownFolders=allFolders(files,folders),folderCase=new Map(knownFolders.map(p=>[p.toLowerCase(),p]));
 const parts=validPath(path).split('/'),folderSet=new Set(folderCase.keys()),fileSet=new Set(files.map(p=>p.toLowerCase()));let parent='';
 for(let i=0;i<parts.length;i++){
  const directory=i<parts.length-1||kind==='folder',original=parts[i],dot=directory?-1:original.lastIndexOf('.'),stem=dot>0?original.slice(0,dot):original,ext=dot>0?original.slice(dot):'';let leaf=original,n=2;
  const key=()=>((parent?parent+'/':'')+leaf).toLowerCase();
  while(fileSet.has(key())||(i===parts.length-1&&folderSet.has(key())))leaf=`${stem} (${n++})${ext}`;
  parent+=(parent?'/':'')+leaf;if(i<parts.length-1)parent=folderCase.get(parent.toLowerCase())||parent;
 }
 return parent;
}
export function planFolderMove(from,to,files,folders){
 to=validPath(to);if(to===from)return {to,files:files.slice(),folders:allFolders(files,folders)};
 if(within(to,from))throw new Error('A folder cannot be moved inside itself.');
 const dirs=allFolders(files,folders),outsideFiles=files.filter(p=>!within(p,from)),outsideFolders=dirs.filter(p=>!within(p,from));
 assertAvailable(to,'folder',outsideFiles,outsideFolders);
 const map=p=>within(p,from)?to+p.slice(from.length):p;
 return {to,files:files.map(map),folders:allFolders(files.map(map),dirs.map(map))};
}
