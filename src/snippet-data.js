// TYPEBENCH — Copyright (C) 2026 Green Shoe Garage. GPL-3.0-only.
// Stored snippets contain only the selected source, never its surrounding document.
import {languageList} from './language-data.js';
export const snippetPalettes={
 dark:{background:'#141a17',foreground:'#e5ebe2',muted:'#a3b2a6',key:'#d8b5ff',str:'#bde390',num:'#ffcb92',comment:'#93aa9b',func:'#8bd9ea',name:'#e9eede'},
 light:{background:'#fafbf5',foreground:'#253329',muted:'#536653',key:'#753398',str:'#306419',num:'#974214',comment:'#526553',func:'#006373',name:'#23352a'},
 contrast:{background:'#000000',foreground:'#ffffff',muted:'#e1e1e1',key:'#eac1ff',str:'#d1ff91',num:'#ffd599',comment:'#d2d2d2',func:'#7eeeff',name:'#ffffff'}
};
export const tokenClasses=new Set(['tok-key','tok-str','tok-num','tok-comment','tok-func','tok-name','tok-heading','tok-em','tok-strong','tok-link']);
const bounded=(v,min,max,fallback)=>Number.isFinite(+v)?Math.max(min,Math.min(max,Math.round(+v))):fallback;
export function snippetOptions(x={}){
 x=x&&typeof x==='object'?x:{};
 const theme=Object.hasOwn(snippetPalettes,x.theme)?x.theme:'dark';
 return {theme,fontSize:[12,14,16,18,20,24,28,32].includes(+x.fontSize)?+x.fontSize:bounded(x.fontSize??16,12,32,16)===32?32:16,padding:[0,16,24,32,48,64,80].includes(+x.padding)?+x.padding:24,tabSize:[2,4,8].includes(+x.tabSize)?+x.tabSize:2,
  background:/^#[\da-f]{6}$/i.test(x.background)?x.background:snippetPalettes[theme].background,
  transparent:!!x.transparent,lineNumbers:x.lineNumbers!==false,showFilename:x.showFilename!==false,scale:[1,2,3].includes(+x.scale)?+x.scale:2};
}
export function cleanSpans(spans,length){
 if(!Array.isArray(spans))return [];
 let end=0;
 return spans.map(s=>{
  if(!Array.isArray(s)||s.length!==3||!Number.isInteger(s[0])||!Number.isInteger(s[1])||s[0]<end||s[1]<=s[0]||s[1]>length||!tokenClasses.has(s[2]))throw new Error('Invalid snippet syntax data.');
  end=s[1];return [s[0],s[1],s[2]];
 });
}
export function validateSnippets(items){
 if(items===undefined)return [];
 if(!Array.isArray(items))throw new Error('The workspace has an invalid snippet collection.');
 const ids=new Set();
 return items.map(s=>{
  if(!s||typeof s.id!=='string'||!s.id||ids.has(s.id)||typeof s.raw!=='string'||s.raw.includes('\0')||typeof s.name!=='string'||typeof s.filename!=='string'||!languageList.some(([id])=>id===s.language)||!Number.isSafeInteger(s.startLine)||s.startLine<1)throw new Error('The workspace has an invalid snippet.');
  ids.add(s.id);
  return {id:s.id,name:s.name,filename:s.filename,raw:s.raw,language:s.language,startLine:s.startLine,options:snippetOptions(s.options),spans:cleanSpans(s.spans,s.raw.replace(/\r\n|\r/g,'\n').length)};
 });
}
