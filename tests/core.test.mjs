import assert from 'node:assert/strict';
import {splitText,joinText,encodeText,decodeBytes,validPath,uniqueName,validateWorkspace} from '../src/core.js';
import {makeState,rawText,undo,redo} from '../src/editor.js';
import {isolateHistory} from '@codemirror/commands';
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS',name);}
for(const raw of ['', 'abc', 'café 🛠️\r\nβ\n日本語\rfinal  ', 'a\r\nb\r\n', 'a\rb', '\n\r\n\r'])test('text round trip '+JSON.stringify(raw),()=>{const s=splitText(raw);assert.equal(joinText(s.text,s.breaks),raw);});
for(const encoding of ['utf-8','utf-16le','utf-16be'])for(const bom of encoding==='utf-8'?[false,true]:[true])test(encoding+' bytes '+bom,()=>{const raw='café 🛠️ é\r\nα\n日本語\r  ';const bytes=encodeText(raw,encoding,bom);const decoded=decodeBytes(bytes);assert.equal(decoded.raw,raw);assert.equal(decoded.bom,bom);assert.equal(decoded.encoding,encoding);assert.deepEqual(encodeText(decoded.raw,decoded.encoding,decoded.bom),bytes);});
test('invalid UTF-8 rejected',()=>assert.throws(()=>decodeBytes(new Uint8Array([0xff,0x00]))));
test('unsafe paths rejected',()=>{for(const p of ['../a','/a','a/../b','a//b','a\u0000','C:/x','CON.txt'])assert.throws(()=>validPath(p));assert.equal(validPath('sketches/blink.ino'),'sketches/blink.ino');});
test('collision suffix',()=>assert.equal(uniqueName('a.md',['a.md','a (2).md']),'a (3).md'));
test('invalid workspace rejected',()=>assert.throws(()=>validateWorkspace({format:'typebench-workspace',schema:2,documents:[],closed:[]})));
const settings={wrap:false,tabSize:2};
function target(raw){const t={state:makeState({raw,eol:splitText(raw).eol,language:'text'},settings,()=>{})};t.dispatch=tr=>{t.state=tr.state;};return t;}
function edit(t,changes,annotation=true){t.state=t.state.update({changes,...(annotation?{annotations:isolateHistory.of('full')}: {})}).state;}
test('mixed line endings survive edit undo redo',()=>{const t=target('one\r\ntwo\nthree\rfour');edit(t,{from:4,to:8,insert:'TWO\nnew\n'});const after=rawText(t.state);assert.equal(after,'one\r\nTWO\r\nnew\r\nthree\rfour');assert.equal(undo(t),true);assert.equal(rawText(t.state),'one\r\ntwo\nthree\rfour');assert.equal(redo(t),true);assert.equal(rawText(t.state),after);});
test('grouped undo restores mixed breaks',()=>{const t=target('a\r\nb\nc');edit(t,{from:1,to:4,insert:'\nx'},false);edit(t,{from:2,to:3,insert:'\ny'},false);undo(t);while(undo(t)){}assert.equal(rawText(t.state),'a\r\nb\nc');while(redo(t)){}assert.equal(rawText(t.state),'a\r\n\r\nyc');});
test('multiple selection operations retain untouched breaks',()=>{const t=target('a\r\nb\nc\rd');edit(t,[{from:0,to:1,insert:'A\nA'},{from:4,to:5,insert:'C'}]);assert.equal(rawText(t.state),'A\r\nA\r\nb\nC\rd');undo(t);assert.equal(rawText(t.state),'a\r\nb\nc\rd');});
test('large pasted text does not hit argument limit',()=>{const t=target('');edit(t,{from:0,insert:'abc\n'.repeat(100000)});assert.equal(rawText(t.state),'abc\n'.repeat(100000));undo(t);assert.equal(rawText(t.state),'');});
console.log(`${passed} checks passed`);
