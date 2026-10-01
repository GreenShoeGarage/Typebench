import assert from 'node:assert/strict';
import {makeState,runEdit,replaceChanges,rawText,undo,redo,appearance,appearanceComp} from '../src/editor.js';
import {splitText} from '../src/core.js';
import {searchText} from '../src/search-engine.js';
let count=0;function test(name,fn){fn();count++;console.log('PASS',name);}
function target(raw,language='text',settings={}){const t={state:makeState({raw,eol:splitText(raw).eol,language},{tabSize:2,...settings},()=>{})};t.dispatch=(...spec)=>{t.state=spec[0].state||t.state.update(...spec).state;};return t;}
function select(t,from,to=from){t.state=t.state.update({selection:{anchor:from,head:to}}).state;}
test('literal search treats regex syntax literally',()=>assert.deepEqual(searchText({text:'[a.*] aab [a.*]',query:'[a.*]'}).map(x=>x[0]),[0,10]));
test('case and Unicode whole-word filtering',()=>{assert.equal(searchText({text:'Cat cat cats αcat cat_ café caféine',query:'cat',wholeWord:true}).length,2);assert.equal(searchText({text:'Cat cat',query:'cat',caseSensitive:true}).length,1);assert.equal(searchText({text:'café caféine',query:'café',wholeWord:true}).length,1);});
test('regex numbered and named captures',()=>{const m=searchText({text:'R12 R99',query:'R(?<n>\\d+)',regexp:true,replace:'pin_$<n>_$1_$$'});assert.deepEqual(m.map(x=>x[2]),['pin_12_12_$','pin_99_99_$']);});
test('literal replacement leaves dollar and slash unchanged',()=>assert.equal(searchText({text:'x',query:'x',replace:'$1\\n'})[0][2],'$1\\n'));
test('regex newline and zero-width behavior',()=>{assert.equal(searchText({text:'a\nb',query:'^',regexp:true,replace:'> '}).length,2);assert.equal(searchText({text:'🛠',query:'(?=)',regexp:true}).length,2);assert.equal(searchText({text:'x',query:'x',regexp:true,replace:'\\n'})[0][2],'\n');});
test('invalid expression rejected',()=>assert.throws(()=>searchText({text:'x',query:'[',regexp:true})));
test('replace all is one undo and retains mixed endings',()=>{const raw='cat\r\ncat\ncat\rtail',t=target(raw);const changes=searchText({text:t.state.doc.toString(),query:'cat',replace:'dog'}).map(([from,to,insert])=>({from,to,insert}));replaceChanges(t,changes);assert.equal(rawText(t.state),'dog\r\ndog\ndog\rtail');undo(t);assert.equal(rawText(t.state),raw);redo(t);assert.equal(rawText(t.state),'dog\r\ndog\ndog\rtail');});
test('indent and outdent preserve separators',()=>{const t=target('a\r\nb\nc');select(t,0,4);runEdit(t,'indent');assert.equal(rawText(t.state),'  a\r\n  b\nc');runEdit(t,'outdent');assert.equal(rawText(t.state),'a\r\nb\nc');undo(t);assert.equal(rawText(t.state),'  a\r\n  b\nc');});
test('tab indentation uses configured setting',()=>{const t=target('a\nb','javascript',{indentStyle:'tabs',tabSize:4});select(t,0,3);runEdit(t,'indent');assert.equal(rawText(t.state),'\ta\n\tb');});
test('move lines retains newline sequence and undoes',()=>{const raw='a\r\nb\nc\rd',t=target(raw);select(t,2);runEdit(t,'moveUp');assert.equal(rawText(t.state),'b\r\na\nc\rd');undo(t);assert.equal(rawText(t.state),raw);runEdit(t,'moveDown');assert.equal(rawText(t.state),'a\r\nc\nb\rd');undo(t);assert.equal(rawText(t.state),raw);});
test('duplicate last line and undo',()=>{const t=target('a\r\nb');select(t,2);runEdit(t,'duplicateLine');assert.equal(rawText(t.state),'a\r\nb\r\nb');undo(t);assert.equal(rawText(t.state),'a\r\nb');});
test('comment toggle and grouped undo',()=>{const t=target('const a=1;\r\nconst b=2;','javascript');select(t,0,t.state.doc.length);runEdit(t,'comment');assert.equal(rawText(t.state),'// const a=1;\r\n// const b=2;');undo(t);assert.equal(rawText(t.state),'const a=1;\r\nconst b=2;');});
test('display and indentation settings do not alter source',()=>{const raw='\t a  \r\nb',t=target(raw);t.dispatch({effects:appearanceComp.reconfigure(appearance({tabSize:8,indentStyle:'tabs',whitespace:true,wrap:true,tabIndents:true}))});assert.equal(rawText(t.state),raw);});
test('100,000 replacements without repeated separator copying',()=>{const t=target('cat\r\n'.repeat(100000));const changes=searchText({text:t.state.doc.toString(),query:'cat',replace:'dog'}).map(([from,to,insert])=>({from,to,insert}));replaceChanges(t,changes);assert.equal(rawText(t.state),'dog\r\n'.repeat(100000));undo(t);assert.equal(rawText(t.state),'cat\r\n'.repeat(100000));});
test('comment is unavailable for plain text and JSON',()=>{for(const language of ['text','json']){const t=target('abc',language);assert.equal(runEdit(t,'comment'),false);assert.equal(rawText(t.state),'abc');}});
console.log(`${count} editing checks passed`);
