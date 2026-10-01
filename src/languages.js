// TYPEBENCH — GPL-3.0-only. Language services only highlight; they never compile or execute.
import {StreamLanguage} from '@codemirror/language';
import {markdown} from '@codemirror/lang-markdown';
import {javascript} from '@codemirror/lang-javascript';
import {cpp} from '@codemirror/lang-cpp';
import {java} from '@codemirror/lang-java';
import {html} from '@codemirror/lang-html';
import {css} from '@codemirror/lang-css';
import {json} from '@codemirror/lang-json';
import {python} from '@codemirror/lang-python';
import {php} from '@codemirror/lang-php';
import {rust} from '@codemirror/lang-rust';
import {sql} from '@codemirror/lang-sql';
import {xml} from '@codemirror/lang-xml';
import {yaml} from '@codemirror/lang-yaml';
import {c, csharp, java as javaStream, cpp as cppStream} from '@codemirror/legacy-modes/mode/clike';
import {go} from '@codemirror/legacy-modes/mode/go';
import {ruby} from '@codemirror/legacy-modes/mode/ruby';
import {shell} from '@codemirror/legacy-modes/mode/shell';
import {powerShell} from '@codemirror/legacy-modes/mode/powershell';
import {toml} from '@codemirror/legacy-modes/mode/toml';
import {tags, tagHighlighter, highlightTree} from '@lezer/highlight';
import {fenceLanguage} from './language-data.js';
const words=s=>new Set(s.split(' '));
export const processingNames={
 functions:words('setup draw size fullScreen background fill noFill stroke noStroke strokeWeight point line triangle quad rect ellipse circle arc bezier curve beginShape endShape vertex pushMatrix popMatrix translate rotate scale pushStyle popStyle colorMode image loadImage loadFont text textSize textFont textAlign frameRate smooth noSmooth random noise map constrain dist lerp millis delay println print save saveFrame mousePressed mouseReleased mouseDragged mouseMoved keyPressed keyReleased loop noLoop redraw'),
 types:words('PVector PImage PFont PGraphics PShape color'),
 constants:words('PI TWO_PI HALF_PI QUARTER_PI TAU RGB HSB P2D P3D JAVA2D CENTER CORNER CORNERS RADIUS CLOSE OPEN CHORD PIE LEFT RIGHT TOP BOTTOM BASELINE width height mouseX mouseY pmouseX pmouseY frameCount key keyCode')
};
export const arduinoNames={
 functions:words('setup loop pinMode digitalWrite digitalRead analogRead analogWrite analogReference delay delayMicroseconds millis micros pulseIn pulseInLong tone noTone shiftOut shiftIn attachInterrupt detachInterrupt interrupts noInterrupts map constrain min max abs random randomSeed bitRead bitWrite bitSet bitClear bit highByte lowByte sizeof F'),
 types:words('String boolean byte word size_t uint8_t uint16_t uint32_t int8_t int16_t int32_t HardwareSerial'),
 constants:words('Serial Serial1 Serial2 Serial3 HIGH LOW INPUT OUTPUT INPUT_PULLUP INPUT_PULLDOWN LED_BUILTIN A0 A1 A2 A3 A4 A5 A6 A7 CHANGE RISING FALLING DEFAULT EXTERNAL INTERNAL LSBFIRST MSBFIRST')
};
function sketchMode(base,names,name){return {...base,name,token(stream,state){const style=base.token(stream,state);const word=stream.current();if(!style||['variable','def','type','builtin','atom'].includes(style)){if(names.functions.has(word))return 'builtin';if(names.types.has(word))return 'type';if(names.constants.has(word))return 'atom';}return style;}};}
const factories={text:()=>null,markdown:()=>markdown({codeLanguages:n=>{const m=languageSupport(fenceLanguage(n));return m?.language||m;}}),javascript:()=>javascript({jsx:true}),typescript:()=>javascript({typescript:true,jsx:true}),json,html,css,python,c:()=>StreamLanguage.define(c),cpp,java,csharp:()=>StreamLanguage.define(csharp),go:()=>StreamLanguage.define(go),rust,php, ruby:()=>StreamLanguage.define(ruby),shell:()=>StreamLanguage.define(shell),powershell:()=>StreamLanguage.define(powerShell),sql,yaml,toml:()=>StreamLanguage.define(toml),xml,processing:()=>StreamLanguage.define(sketchMode(javaStream,processingNames,'processing')),arduino:()=>StreamLanguage.define(sketchMode(cppStream,arduinoNames,'arduino'))};
const cache=new Map();
export function languageSupport(id){if(!cache.has(id))cache.set(id,(factories[id]||factories.text)());return cache.get(id);}
export const tokenStyle=tagHighlighter([
 {tag:[tags.keyword,tags.modifier,tags.operatorKeyword],class:'tok-key'},
 {tag:[tags.string,tags.special(tags.string),tags.regexp],class:'tok-str'},
 {tag:[tags.number,tags.bool,tags.null,tags.atom],class:'tok-num'},
 {tag:tags.comment,class:'tok-comment'},
 {tag:[tags.function(tags.variableName),tags.standard(tags.variableName),tags.typeName,tags.className],class:'tok-func'},
 {tag:tags.heading,class:'tok-heading'},{tag:tags.emphasis,class:'tok-em'},{tag:tags.strong,class:'tok-strong'},
 {tag:[tags.link,tags.url],class:'tok-link'},{tag:[tags.variableName,tags.propertyName,tags.tagName,tags.attributeName],class:'tok-name'}
]);
export const escapeHTML=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function highlightCode(code,id){const support=languageSupport(id),lang=support?.language||support;if(!lang)return escapeHTML(code);const spans=[];highlightTree(lang.parser.parse(code),tokenStyle,(from,to,cls)=>spans.push({from,to,cls}));let result='',pos=0;for(const {from,to,cls} of spans){result+=escapeHTML(code.slice(pos,from))+`<span class="${cls}">${escapeHTML(code.slice(from,to))}</span>`;pos=to;}return result+escapeHTML(code.slice(pos));}
