// TYPEBENCH — GPL-3.0-only. Parsing stays off the editor thread.
import {Marked} from 'marked';
import {parser} from '@lezer/markdown';
import {highlightCode,escapeHTML} from './languages.js';
import {fenceLanguage} from './language-data.js';
self.onmessage=({data:{id,text}})=>{
 try {
  const slugs=new Map();
  const md=new Marked({gfm:true,renderer:{
   html({text}){return escapeHTML(text);},
   code({text,lang}){return '<pre><code>'+highlightCode(text,fenceLanguage(lang))+'</code></pre>';},
   image({href,title,text}){return `<span class="image-placeholder" data-image="${escapeHTML(href)}" data-alt="${escapeHTML(text)}">Image: ${escapeHTML(text||title||href)}</span>`;},
   heading({tokens,depth}){const inline=this.parser.parseInline(tokens),plain=inline.replace(/<[^>]*>/g,'').replace(/&(?:amp|lt|gt|quot|#39);/g,'').toLowerCase().replace(/[^\p{L}\p{N} _-]/gu,'').trim().replace(/\s+/g,'-')||'section';const count=slugs.get(plain)||0;slugs.set(plain,count+1);const id='tb-'+plain+(count?'-'+(count+1):'');return `<h${depth} id="${escapeHTML(id)}">${inline}</h${depth}>`;},
   link({href,title,tokens}){if(!href.startsWith('#'))return false;return `<a href="#tb-${escapeHTML(href.slice(1))}">${this.parser.parseInline(tokens)}</a>`;}
  }});
  const starts=[];parser.parse(text).iterate({enter(node){if(/^(ATX|Setext)Heading[1-6]$/.test(node.name))starts.push(node.from);}});
  self.postMessage({id,html:md.parse(text),starts});
 }catch(e){self.postMessage({id,error:e.message});}
};
