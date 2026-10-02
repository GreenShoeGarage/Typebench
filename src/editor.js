// TYPEBENCH — Copyright (C) 2026 Green Shoe Garage. GPL-3.0-only.
import {EditorState, StateField, StateEffect, Compartment, Facet, Transaction, Prec} from '@codemirror/state';
import {EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine, drawSelection, dropCursor, highlightWhitespace, Decoration, ViewPlugin} from '@codemirror/view';
import {history, historyKeymap, defaultKeymap, invertedEffects, undo, redo, undoDepth, redoDepth, indentMore, indentLess, toggleComment, copyLineDown, moveLineUp, moveLineDown, isolateHistory} from '@codemirror/commands';
import {syntaxHighlighting, HighlightStyle, bracketMatching, indentOnInput, indentUnit} from '@codemirror/language';
import {closeBrackets,deleteBracketPair} from '@codemirror/autocomplete';
import {languageSupport, tokenStyle} from './languages.js';
import {splitText, joinText} from './core.js';
export {EditorView,undo,redo,undoDepth,redoDepth, indentMore, indentLess, toggleComment, copyLineDown, moveLineUp, moveLineDown, isolateHistory};
const newline = Facet.define({combine:v=>v[0]||'\n'});
export const restoreBreaks=StateEffect.define();
export const lineBreaks=StateField.define({
  create:()=>[],
  update(value,tr) {
    let next=value;
    if(tr.docChanged) {
      const chunks=[];let consumed=0,affected=false;
      tr.changes.iterChanges((from,to,fromB,toB,inserted)=>{
        const start=tr.startState.doc.lineAt(from).number-1;
        const removed=tr.startState.doc.lineAt(to).number-tr.startState.doc.lineAt(from).number;
        if(!removed&&inserted.lines===1)return;
        chunks.push(value.slice(consumed,start),Array(inserted.lines-1).fill(tr.startState.facet(newline)));
        consumed=start+removed;affected=true;
      });
      if(affected){chunks.push(value.slice(consumed));next=chunks.flat();}
    }
    for(const e of tr.effects) if(e.is(restoreBreaks)) next=e.value;
    return next;
  }
});
const languageName=Facet.define({combine:v=>v[0]||'text'});
export function languageExtension(id) {
  return [languageName.of(id),languageSupport(id)||[]];
}
export const languageComp=new Compartment(), appearanceComp=new Compartment();
export function appearance(settings) {return [settings.autoBrackets!==false?[closeBrackets(),Prec.high(keymap.of([{key:'Backspace',run:view=>deleteBracketPair({state:view.state,dispatch:tr=>view.dispatch(view.state.update({changes:tr.changes,selection:tr.selection,effects:tr.effects,annotations:isolateHistory.of('full'),userEvent:'delete.backward',scrollIntoView:true}))})}])),Prec.highest(EditorState.languageData.of(()=>[{closeBrackets:{brackets:['(','[','{']}}]))]:[],settings.wrap?EditorView.lineWrapping:[],settings.whitespace?highlightWhitespace():[],EditorState.tabSize.of(settings.tabSize),indentUnit.of(settings.indentStyle==='tabs'?'\t':' '.repeat(settings.tabSize)),settings.tabIndents?keymap.of([{key:'Tab',run:insertIndent,shift:v=>runEdit(v,'outdent')}]):[]];}
const editCommands={indent:indentMore,outdent:indentLess,comment:toggleComment,duplicateLine:copyLineDown,moveUp:moveLineUp,moveDown:moveLineDown};
export function runEdit(target,name){
  const fn=editCommands[name];if(!fn)return false;if(name==='comment'&&['text','markdown','json'].includes(target.state.facet(languageName)))return false;
  return fn({state:target.state,dispatch:tr=>{
    const effects=[...tr.effects];
    // Moving text between existing lines does not normalize their separators.
    if(name==='moveUp'||name==='moveDown')effects.push(restoreBreaks.of(target.state.field(lineBreaks)));
    target.dispatch(target.state.update({changes:tr.changes,selection:tr.selection,effects,annotations:isolateHistory.of('full'),scrollIntoView:tr.scrollIntoView,userEvent:tr.annotation(Transaction.userEvent)||'input'}));
  }});
}
function insertIndent(view){
  const s=view.state,sel=s.selection.main;if(!sel.empty)return runEdit(view,'indent');
  const unit=s.facet(indentUnit),line=s.doc.lineAt(sel.head);let col=0;
  for(const ch of s.sliceDoc(line.from,sel.head))col+=ch==='\t'?s.tabSize-col%s.tabSize:1;
  const insert=unit==='\t'?'\t':' '.repeat(s.tabSize-col%s.tabSize);
  view.dispatch(s.replaceSelection(insert),{scrollIntoView:true,userEvent:'input'});return true;
}
export function replaceChanges(view,changes){view.dispatch({changes,annotations:isolateHistory.of('full'),userEvent:'input.replace',scrollIntoView:true});}
export const setMatches=StateEffect.define();
const matchesField=StateField.define({create:()=>[],update:(value,tr)=>{if(tr.docChanged)value=[];for(const e of tr.effects)if(e.is(setMatches))value=e.value;return value;}});
const searchMarks=ViewPlugin.fromClass(class{
  constructor(view){this.decorations=this.build(view);}
  update(u){if(u.docChanged||u.viewportChanged||u.startState.field(matchesField)!==u.state.field(matchesField))this.decorations=this.build(u.view);}
  build(view){const result=[],matches=view.state.field(matchesField);for(const range of view.visibleRanges){let lo=0,hi=matches.length;while(lo<hi){const mid=(lo+hi)>>1;if(matches[mid][1]<range.from)lo=mid+1;else hi=mid;}for(let i=lo;i<matches.length&&matches[i][0]<=range.to;i++){const [from,to]=matches[i];if(from<to&&from<range.to&&to>range.from)result.push(Decoration.mark({class:'cm-search-match'}).range(Math.max(from,range.from),Math.min(to,range.to)));}}return Decoration.set(result,true);}
},{decorations:x=>x.decorations});
export function makeState(doc,settings,onUpdate) {
  const parsed=splitText(doc.raw);
  return EditorState.create({doc:parsed.text,selection:doc.selection && Number.isInteger(doc.selection.head) && Number.isInteger(doc.selection.anchor) && doc.selection.head>=0 && doc.selection.anchor>=0 && doc.selection.head<=parsed.text.length && doc.selection.anchor<=parsed.text.length?doc.selection:undefined,extensions:[
    lineNumbers(),highlightActiveLineGutter(),highlightActiveLine(),drawSelection(),dropCursor(),history(),
    lineBreaks.init(()=>parsed.breaks),newline.of(doc.eol||parsed.eol),
    invertedEffects.of(tr=>tr.docChanged?[restoreBreaks.of(tr.startState.field(lineBreaks))]:[]),
    keymap.of([{key:'Mod-]',run:v=>runEdit(v,'indent')},{key:'Mod-[',run:v=>runEdit(v,'outdent')},{key:'Mod-/',run:v=>{runEdit(v,'comment');return true;}},{key:'Alt-ArrowUp',run:v=>runEdit(v,'moveUp')},{key:'Alt-ArrowDown',run:v=>runEdit(v,'moveDown')},{key:'Alt-Shift-ArrowDown',run:v=>runEdit(v,'duplicateLine')},...historyKeymap,...defaultKeymap.filter(k=>!Object.values(editCommands).includes(k.run))]),matchesField,searchMarks,bracketMatching(),indentOnInput(),
    syntaxHighlighting(tokenStyle),languageComp.of(languageExtension(doc.language)),appearanceComp.of(appearance(settings)),
    EditorView.contentAttributes.of({'aria-label':'Document text',tabindex:'0',spellcheck:'false',autocapitalize:'off',autocorrect:'off'}),
    EditorView.updateListener.of(onUpdate)
  ]});
}
export function rawText(state){return joinText(state.doc.toString(),state.field(lineBreaks));}
