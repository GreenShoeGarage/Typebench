// TYPEBENCH — Copyright (C) 2026 Green Shoe Garage. GPL-3.0-only.
import {EditorView,setMatches,replaceChanges} from './editor.js';
const $=id=>document.getElementById(id);
export class FindPanel {
  constructor(getView,notify){this.getView=getView;this.notify=notify;this.worker=null;this.timer=null;this.deadline=null;this.id=0;this.matches=[];this.doc=null;this.index=-1;this.pending=false;this.showing=false;this.afterSearch=null;
    for(const id of ['findQuery','replaceQuery'])$(id).addEventListener('input',()=>this.schedule());
    for(const id of ['findCase','findWord','findRegex'])$(id).addEventListener('change',()=>this.schedule());
    $('findPrev').onclick=()=>this.navigate(-1);$('findNext').onclick=()=>this.navigate(1);$('replaceOne').onclick=()=>this.replace(false);$('replaceAll').onclick=()=>this.replace(true);
    $('findClose').onclick=()=>this.close();$('findCancel').onclick=()=>{this.stop();this.message('Search cancelled. Change the query to try again.');};
    $('findQuery').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();if(this.pending)this.afterSearch=()=>this.navigate(e.shiftKey?-1:1);else this.navigate(e.shiftKey?-1:1);}};
    $('findPanel').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();this.close();}});
    $('regexDetails').ontoggle=()=>{if(!$('regexDetails').open && $('findRegex').checked){$('findRegex').checked=false;this.schedule();}};
  }
  message(text){$('findStatus').textContent=text;}
  controls(){const ready=!this.pending&&!!this.matches.length&&this.doc===this.getView()?.state.doc;for(const id of ['findPrev','findNext','replaceOne','replaceAll'])$(id).disabled=!ready;$('findCancel').hidden=!this.pending;}
  stop(){clearTimeout(this.timer);clearTimeout(this.deadline);this.worker?.terminate();this.worker=null;this.id++;this.pending=false;this.matches=[];this.index=-1;this.doc=null;this.afterSearch=null;this.getView()?.dispatch({effects:setMatches.of([])});this.controls();}
  open(){const view=this.getView();if(!view)return;this.showing=true;$('findPanel').hidden=false;const sel=view.state.selection.main;if(!sel.empty){const text=view.state.sliceDoc(sel.from,sel.to);if(!text.includes('\n')&&text.length<1000)$('findQuery').value=text;}$('findQuery').focus();$('findQuery').select();this.schedule();view.requestMeasure();}
  close(){this.showing=false;$('findPanel').hidden=true;this.stop();this.getView()?.focus();this.getView()?.requestMeasure();}
  changed(){if(this.showing)this.schedule();}
  selectionChanged(){if(!this.pending&&this.doc===this.getView()?.state.doc){const sel=this.getView().state.selection.main;this.index=this.matches.findIndex(m=>m[0]===sel.from&&m[1]===sel.to);this.count();}}
  count(){this.message(this.matches.length?(this.index>=0?`${this.index+1} of ${this.matches.length.toLocaleString()} matches`:`${this.matches.length.toLocaleString()} ${this.matches.length===1?'match':'matches'}`):'No matches');}
  schedule(){this.stop();if(!this.showing)return;const query=$('findQuery').value;if(!query){this.message('Search this document');return;}this.pending=true;this.message('Searching…');this.controls();this.timer=setTimeout(()=>this.search(),150);}
  search(){
    const view=this.getView();if(!view)return;const id=++this.id;const doc=view.state.doc;this.doc=doc;
    try{this.worker=new Worker(new URL('./assets/search-worker.js',document.baseURI));}catch{this.pending=false;this.message('Search needs HTTPS or localhost. See README for local setup.');this.controls();return;}
    const failed=text=>{this.stop();this.message(text);};
    this.deadline=setTimeout(()=>failed('Search took too long and was stopped. Simplify the expression or narrow the query.'),2500);
    this.worker.onerror=()=>failed('Search could not start. Reload online once, or run the app on localhost.');
    this.worker.onmessage=({data})=>{if(data.id!==this.id||doc!==this.getView()?.state.doc)return;clearTimeout(this.deadline);this.worker.terminate();this.worker=null;this.pending=false;if(data.error){this.matches=[];this.message(data.error);this.controls();return;}this.matches=data.matches;this.index=-1;view.dispatch({effects:setMatches.of(this.matches)});this.count();this.controls();const next=this.afterSearch;this.afterSearch=null;next?.();};
    this.worker.postMessage({id,text:doc.toString(),query:$('findQuery').value,replace:$('replaceQuery').value,caseSensitive:$('findCase').checked,wholeWord:$('findWord').checked,regexp:$('findRegex').checked});
  }
  navigate(direction){const view=this.getView();if(!view||this.pending||this.doc!==view.state.doc||!this.matches.length)return;const sel=view.state.selection.main;let index=this.matches.findIndex(m=>m[0]===sel.from&&m[1]===sel.to);if(index>=0)index=(index+direction+this.matches.length)%this.matches.length;else if(direction>0){index=this.matches.findIndex(m=>m[0]>=sel.to);if(index<0)index=0;}else{index=this.matches.findLastIndex(m=>m[1]<=sel.from);if(index<0)index=this.matches.length-1;}const m=this.matches[index];view.dispatch({selection:{anchor:m[0],head:m[1]},effects:EditorView.scrollIntoView(m[0],{y:'center'})});this.index=index;this.count();}
  replace(all){const view=this.getView();if(!view||this.pending||this.doc!==view.state.doc||!this.matches.length)return;let selected;
    if(all)selected=this.matches;else{const s=view.state.selection.main;let m=this.matches.find(m=>m[0]===s.from&&m[1]===s.to);if(!m){this.navigate(1);const next=view.state.selection.main;m=this.matches.find(m=>m[0]===next.from&&m[1]===next.to);}if(!m)return;selected=[m];}
    const changes=selected.map(([from,to,insert])=>({from,to,insert}));const count=changes.length;replaceChanges(view,changes);this.notify(`Replaced ${count.toLocaleString()} ${count===1?'match':'matches'}. Undo restores the whole operation.`);
  }
}
