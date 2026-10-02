// TYPEBENCH — GPL-3.0-only. ZIP export never sends files to a server.
import {Zip,ZipDeflate,ZipPassThrough} from 'fflate';
import {encodeText,validPath} from './core.js';
import {allFolders,ancestors} from './folder-data.js';
self.onmessage=({data:{documents,folders=[]}})=>{
 try{
  const names=documents.map(d=>validPath(d.name)),seen=new Set();
  for(const name of names){const lower=name.toLowerCase();if(seen.has(lower)||names.some(other=>other.toLowerCase().startsWith(lower+'/')))throw new Error('Paths conflict as files/folders or differ only by letter case. Rename them before ZIP export: '+name);seen.add(lower);}
  const directories=allFolders(names,folders.map(validPath)),directoryKeys=new Set();
  for(const dir of directories){const key=dir.toLowerCase();if(seen.has(key)||directoryKeys.has(key)||ancestors(dir).some(p=>seen.has(p.toLowerCase())))throw new Error('Paths conflict as files/folders or differ only by letter case. Rename them before ZIP export: '+dir);directoryKeys.add(key);}
  const chunks=[];let size=0;
  const zip=new Zip((error,chunk,final)=>{if(error)throw error;chunks.push(chunk);size+=chunk.length;if(final){const output=new Uint8Array(size);let p=0;for(const c of chunks){output.set(c,p);p+=c.length;}self.postMessage({done:true,bytes:output},[output.buffer]);}});
  for(const folder of directories){const entry=new ZipPassThrough(folder+'/');zip.add(entry);entry.push(new Uint8Array(0),true);}
  documents.forEach((d,i)=>{const entry=new ZipDeflate(names[i],{level:6});zip.add(entry);entry.push(encodeText(d.raw,d.encoding,d.bom),true);self.postMessage({progress:i+1,total:documents.length});});zip.end();
 }catch(e){self.postMessage({error:e.message});}
};
