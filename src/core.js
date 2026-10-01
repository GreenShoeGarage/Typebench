// TYPEBENCH — Copyright (C) 2026 Green Shoe Garage. GPL-3.0-only.
export const VERSION = '1.0.0';
export function splitText(raw) {
  const breaks = raw.match(/\r\n|\r|\n/g) || [];
  const counts = new Map();
  for (const b of breaks) counts.set(b, (counts.get(b) || 0) + 1);
  const eol = [...counts].sort((a,b) => b[1]-a[1])[0]?.[0] || '\n';
  return {text: raw.replace(/\r\n|\r/g, '\n'), breaks, eol};
}
export function joinText(text, breaks) {
  let i=0;
  return text.replace(/\n/g, () => breaks[i++] ?? '\n');
}
export function eolLabel(breaks, fallback='\n') {
  const unique = new Set(breaks.length ? breaks : [fallback]);
  return unique.size > 1 ? 'Mixed EOL' : ({'\n':'LF','\r\n':'CRLF','\r':'CR'}[[...unique][0]]);
}
export function validPath(value) {
  const path = value.trim().replace(/\\/g, '/');
  if (!path || path.startsWith('/') || /[\x00-\x1f<>:"|?*]/.test(path) || path.split('/').some(p=>!p || p==='.' || p==='..' || /[. ]$/.test(p))) throw new Error('Use a relative filename such as notes.md or sketches/blink.ino. Avoid reserved characters and .. path segments.');
  if(path.split('/').some(p=>/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(p))) throw new Error('That filename is reserved on Windows. Choose another name.');
  return path;
}
export function uniqueName(name, names) {
  if (!names.includes(name)) return name;
  const slash=name.lastIndexOf('/'), dot=name.lastIndexOf('.');
  const stem=dot>slash ? name.slice(0,dot) : name, ext=dot>slash ? name.slice(dot) : '';
  let n=2;
  while(names.includes(`${stem} (${n})${ext}`)) n++;
  return `${stem} (${n})${ext}`;
}
export {detectLanguage} from './language-data.js';
export function decodeBytes(input) {
  const bytes = new Uint8Array(input);
  let encoding='utf-8', bom=false, skip=0;
  if(bytes[0]===0xef && bytes[1]===0xbb && bytes[2]===0xbf) {bom=true;skip=3;}
  else if(bytes[0]===0xff && bytes[1]===0xfe) {encoding='utf-16le';bom=true;skip=2;}
  else if(bytes[0]===0xfe && bytes[1]===0xff) {encoding='utf-16be';bom=true;skip=2;}
  let raw;
  try {raw=new TextDecoder(encoding,{fatal:true,ignoreBOM:true}).decode(bytes.subarray(skip));}
  catch {throw new Error('This file is not valid UTF-8 or BOM-marked UTF-16. Convert a copy to UTF-8 first; the original file was not changed.');}
  if(raw.includes('\0')) throw new Error('This file contains NUL bytes and may be binary. TYPEBENCH opens text files only.');
  return {raw,encoding,bom};
}
export function encodeText(raw, encoding='utf-8', bom=false) {
  if(encoding==='utf-8') {
    const data=new TextEncoder().encode(raw);
    if(!bom) return data;
    const all=new Uint8Array(data.length+3);all.set([239,187,191]);all.set(data,3);return all;
  }
  const out=new Uint8Array(raw.length*2+(bom?2:0));
  const le=encoding==='utf-16le';
  if(bom) out.set(le?[255,254]:[254,255]);
  for(let i=0;i<raw.length;i++) {const c=raw.charCodeAt(i),j=i*2+(bom?2:0);out[j]=le?c&255:c>>8;out[j+1]=le?c>>8:c&255;}
  return out;
}
export function validateWorkspace(x) {
  if(x?.format!=='typebench-workspace' || x.schema!==1 || !Array.isArray(x.documents) || !Array.isArray(x.closed)) throw new Error('This is not a supported TYPEBENCH workspace (schema 1).');
  const ids=new Set(),names=new Set();
  for(const d of [...x.documents,...x.closed]) {
    if(!d || typeof d.id!=='string' || ids.has(d.id) || typeof d.raw!=='string' || typeof d.language!=='string' || typeof d.baseRaw!=='string' || !['utf-8','utf-16le','utf-16be'].includes(d.encoding)) throw new Error('The workspace has an invalid document. Your current workspace has not been replaced.');
    if(validPath(d.name)!==d.name||typeof d.baseName!=='string'||typeof d.bom!=='boolean')throw new Error('The workspace contains an invalid filename or encoding setting.');ids.add(d.id);
  }
  for(const d of x.documents) {if(names.has(d.name)) throw new Error('The workspace contains duplicate paths.');names.add(d.name);}
  return x;
}
export class WorkspaceStore {
  constructor(name) {this.name=name;this.db=null;}
  async open() {
    this.db=await new Promise((resolve,reject)=>{const r=indexedDB.open(this.name,1);r.onupgradeneeded=()=>r.result.createObjectStore('workspace');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('Another window is blocking browser storage.'));});
    this.db.onversionchange=()=>this.db.close();
  }
  async read() {return new Promise((resolve,reject)=>{const r=this.db.transaction('workspace').objectStore('workspace').get('current');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
  async write(data, expectedRevision) {
    return new Promise((resolve,reject)=>{
      const tx=this.db.transaction('workspace','readwrite'), store=tx.objectStore('workspace');
      let conflict=false;
      const r=store.get('current');
      r.onsuccess=()=>{if((r.result?.revision||0)!==expectedRevision){conflict=true;tx.abort();return;}store.put({revision:expectedRevision+1,data},'current');};
      tx.oncomplete=()=>resolve(expectedRevision+1);
      tx.onerror=tx.onabort=()=>reject(conflict?new Error('CONFLICT'):tx.error||new Error('Browser storage write failed.'));
    });
  }
}
