// TYPEBENCH — Copyright (C) 2026 Green Shoe Garage. GPL-3.0-only.
const word = /[\p{L}\p{N}\p{M}_]/u;
function before(text,index){if(index===0)return '';const end=text.charCodeAt(index-1);return text.slice(index-(end>=0xdc00&&end<=0xdfff?2:1),index);}
function after(text,index){return index>=text.length?'':String.fromCodePoint(text.codePointAt(index));}
function expand(template,match,text){
  const escaped=template.replace(/\\(n|r|t|\\)/g,(_,x)=>({n:'\n',r:'\r',t:'\t','\\':'\\'})[x]);
  return escaped.replace(/\$(\$|&|`|'|\d{1,2}|<[^>]+>)/g,(full,key)=>{
    if(key==='$')return '$';if(key==='&')return match[0];if(key==='`')return text.slice(0,match.index);if(key==="'")return text.slice(match.index+match[0].length);
    if(key.startsWith('<'))return match.groups?match.groups[key.slice(1,-1)]||'':full;
    const n=+key;if(n>0&&n<match.length)return match[n]||'';
    if(key.length===2&&+key[0]>0&&+key[0]<match.length)return (match[+key[0]]||'')+key[1];return full;
  });
}
export function searchText({text,query,replace='',caseSensitive=false,wholeWord=false,regexp=false}){
  if(!query)return [];
  const pattern=regexp?query:query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const re=new RegExp(pattern,'gmu'+(caseSensitive?'':'i'));const results=[];let match;
  while((match=re.exec(text))!==null){const from=match.index,to=from+match[0].length;
    if(!wholeWord||(!word.test(before(text,from))&&!word.test(after(text,to))))results.push([from,to,regexp?expand(replace,match,text):replace]);
    if(match[0].length===0)re.lastIndex=to+(text.codePointAt(to)>0xffff?2:1);
  }return results;
}
