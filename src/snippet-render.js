// TYPEBENCH — GPL-3.0-only. Script-free exports with escaped source and inline colors.
import {snippetOptions,snippetPalettes} from './snippet-data.js';
export const monoFont='ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace';
export const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const xml=s=>escape(String(s).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\ufffe\uffff]/g,'�').replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g,'�'));
const normalized=s=>s.replace(/\r\n|\r/g,'\n');
function styleFor(cls,p){
 const kind=cls.replace('tok-','');
 return {color:p[kind]||p.foreground,bold:['heading','strong'].includes(kind),italic:['comment','em'].includes(kind),underline:kind==='link'};
}
export function snippetRuns(s){
 const code=normalized(s.raw),runs=[];let pos=0;
 for(const [from,to,cls] of s.spans||[]){if(from>pos)runs.push({text:code.slice(pos,from),cls:''});runs.push({text:code.slice(from,to),cls});pos=to;}
 if(pos<code.length)runs.push({text:code.slice(pos),cls:''});
 return runs;
}
export function snippetHTML(s){
 const o=snippetOptions(s.options),p=snippetPalettes[o.theme];
 const code=snippetRuns(s).map(r=>{const t=styleFor(r.cls,p);return `<span style="color:${t.color}${t.bold?';font-weight:bold':''}${t.italic?';font-style:italic':''}${t.underline?';text-decoration:underline':''}">${escape(r.text)}</span>`;}).join('');
 const font=`font-family:${monoFont};font-size:${o.fontSize}px;line-height:1.65;font-variant-ligatures:none;tab-size:${o.tabSize};white-space:pre;letter-spacing:normal;text-align:left;text-transform:none;direction:ltr`;
 const lineCount=normalized(s.raw).split('\n').length;
 const numbers=o.lineNumbers?`<pre aria-hidden="true" style="${escape(font)};color:${p.muted};margin:0;padding:0 20px 0 0;border:0;background:transparent;user-select:none;text-align:right">${Array.from({length:lineCount},(_,i)=>s.startLine+i).join('\n')}</pre>`:'';
 return `<figure style="margin:0;padding:${o.padding}px;background:${o.transparent?'transparent':o.background};color:${p.foreground};border-radius:8px;max-width:100%;box-sizing:border-box;overflow:auto;color-scheme:${o.theme==='light'?'light':'dark'}">${o.showFilename&&s.filename?`<figcaption style="font:13px/1.5 ${escape(monoFont)};color:${p.muted};margin:0 0 18px;white-space:pre-wrap;overflow-wrap:anywhere">${escape(s.filename)}</figcaption>`:''}<div style="display:flex;align-items:flex-start">${numbers}<pre style="${escape(font)};margin:0;padding:0;border:0;background:transparent"><code style="font:inherit;color:inherit;background:transparent;padding:0">${code}</code></pre></div></figure>`;
}
export function snippetDocument(s){return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${escape(s.name||'Code snippet')}</title></head><body style="margin:24px;background:${s.options.transparent?'#fff':s.options.background}">${snippetHTML(s)}</body></html>\n`;}
export function snippetMarkdown(s){
 const ticks=s.raw.match(/`+/g)||[],fence='`'.repeat(ticks.reduce((max,x)=>Math.max(max,x.length+1),3));
 const eol=s.raw.match(/\r\n|\r|\n/)?.[0]||'\n';
 return `${fence}${s.language==='text'?'':s.language}${eol}${s.raw}${/[\r\n]$/.test(s.raw)?'':eol}${fence}${eol}`;
}
// A shared measured layout keeps SVG and PNG aligned. Tabs expand only in the image.
export function layoutSnippet(s,measure){
 const o=snippetOptions(s.options),p=snippetPalettes[o.theme],lines=[[]];let column=0;
 for(const r of snippetRuns(s)){
  const pieces=r.text.split('\n');
  pieces.forEach((part,i)=>{
   if(i){lines.push([]);column=0;}
   let text='';for(const c of part){if(c==='\t'){const n=o.tabSize-column%o.tabSize;text+=' '.repeat(n);column+=n;}else{text+=c;column++;}}
   if(text)lines.at(-1).push({text,...styleFor(r.cls,p)});
  });
 }
 const lineHeight=Math.ceil(o.fontSize*1.65),gutter=o.lineNumbers?measure(String(s.startLine+lines.length-1),o.fontSize,false,false)+20:0;
 const header=o.showFilename&&s.filename?{text:s.filename.replace(/[\r\n\t]/g,' '),size:13}:null;
 let contentWidth=0;
 lines.forEach(line=>{let x=0;for(const run of line){run.x=x;run.width=measure(run.text,o.fontSize,run.bold,run.italic);x+=run.width;}contentWidth=Math.max(contentWidth,x);});
 const width=Math.ceil(Math.max(contentWidth+gutter,header?measure(header.text,13,false,false):0,100)+o.padding*2+2);
 const headerHeight=header?36:0,height=Math.ceil(o.padding*2+headerHeight+lines.length*lineHeight);
 return {o,p,lines,header,width,height,lineHeight,gutter,top:o.padding+headerHeight,baseline:o.fontSize*1.08};
}
export function snippetSVG(s,layout){
 const {o,p,lines,header,width,height,lineHeight,gutter,top,baseline}=layout;
 const body=[];
 if(!o.transparent)body.push(`<rect width="100%" height="100%" rx="8" fill="${o.background}"/>`);
 if(header)body.push(`<text x="${o.padding}" y="${o.padding+14}" font-size="13" fill="${p.muted}">${xml(header.text)}</text>`);
 lines.forEach((line,i)=>{const y=top+i*lineHeight+baseline;if(o.lineNumbers)body.push(`<text x="${o.padding+gutter-20}" y="${y}" text-anchor="end" fill="${p.muted}">${s.startLine+i}</text>`);
  body.push(`<text x="${o.padding+gutter}" y="${y}" xml:space="preserve">${line.map(r=>`<tspan x="${o.padding+gutter+r.x}" fill="${r.color}"${r.bold?' font-weight="bold"':''}${r.italic?' font-style="italic"':''}${r.underline?' text-decoration="underline"':''}>${xml(r.text)}</tspan>`).join('')}</text>`);
 });
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description"><title id="title">${xml(s.name||'Code snippet')}</title><desc id="description">${xml(s.raw)}</desc><g font-family="${xml(monoFont)}" font-size="${o.fontSize}" style="font-variant-ligatures:none">${body.join('')}</g></svg>`;
}
export function paintSnippet(canvas,s,layout){
 const {o,p,width,height,lines,header,gutter,top,lineHeight,baseline}=layout;
 // Explicit raster memory budget: do not allocate an unbounded browser canvas.
 if(width*o.scale>16384||height*o.scale>16384||width*height*o.scale*o.scale>32000000)throw new Error('This PNG would be too large for a reliable browser canvas. Lower the PNG scale or font size, select less code, or export SVG / HTML instead.');
 canvas.width=width*o.scale;canvas.height=height*o.scale;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Image drawing is unavailable. Export SVG or HTML instead.');
 ctx.scale(o.scale,o.scale);
 if(!o.transparent){ctx.fillStyle=o.background;ctx.beginPath();ctx.roundRect(0,0,width,height,8);ctx.fill();}
 const draw=(text,x,y,size,color,bold=false,italic=false)=>{ctx.font=`${italic?'italic ':''}${bold?'bold ':''}${size}px ${monoFont}`;ctx.fillStyle=color;ctx.fillText(text,x,y);};
 if(header)draw(header.text,o.padding,o.padding+14,13,p.muted);
 lines.forEach((line,i)=>{const y=top+i*lineHeight+baseline;if(o.lineNumbers){ctx.textAlign='right';draw(String(s.startLine+i),o.padding+gutter-20,y,o.fontSize,p.muted);ctx.textAlign='left';}for(const r of line){draw(r.text,o.padding+gutter+r.x,y,o.fontSize,r.color,r.bold,r.italic);if(r.underline){ctx.fillStyle=r.color;ctx.fillRect(o.padding+gutter+r.x,y+2,r.width,1);}}});
}
