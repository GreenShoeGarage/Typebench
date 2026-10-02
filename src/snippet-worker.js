// TYPEBENCH — GPL-3.0-only. Parse in an interruptible worker, then crop to the selection.
import {languageSupport,tokenStyle} from './languages.js';
import {highlightTree} from '@lezer/highlight';
self.onmessage=({data:{code,language,from,to}})=>{
 try{
  const support=languageSupport(language),lang=support?.language||support,spans=[];
  if(lang)highlightTree(lang.parser.parse(code),tokenStyle,(a,b,cls)=>{if(b>from&&a<to)spans.push([Math.max(a,from)-from,Math.min(b,to)-from,cls]);},from,to);
  self.postMessage({spans});
 }catch(e){self.postMessage({error:'Syntax colors could not be generated. '+e.message});}
};
