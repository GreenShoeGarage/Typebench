// TYPEBENCH — GPL-3.0-only. Context menu with pointer, touch-button, and keyboard entry.
export class FileMenu{
 constructor({element,resolve,actions,selector='[data-document-id]',attribute='documentId',surfaces=[document.getElementById('tabs'),document.getElementById('fileList')]}){
  Object.assign(this,{element,resolve,actions});this.target=null;this.opener=null;
  for(const surface of surfaces){
   surface.addEventListener('contextmenu',e=>{const row=e.target.closest(selector);if(!row)return;e.preventDefault();this.open(row.dataset[attribute],e.clientX,e.clientY,row.querySelector('button')||row);});
   surface.addEventListener('keydown',e=>{if(e.key==='F2'){const row=e.target.closest(selector),d=row&&this.resolve(row.dataset[attribute]);if(d){e.preventDefault();e.stopPropagation();this.actions.rename(d);}return;}if(e.key==='ContextMenu'||(e.shiftKey&&e.key==='F10')){const row=e.target.closest(selector);if(!row)return;e.preventDefault();e.stopPropagation();const r=e.target.getBoundingClientRect();this.open(row.dataset[attribute],r.left,r.bottom,e.target);}});
  }
  element.addEventListener('keydown',e=>{const items=[...element.querySelectorAll('[role=menuitem]:not(:disabled)')],index=items.indexOf(document.activeElement);if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();items[e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();}else if(e.key==='Escape'||e.key==='Tab'){e.preventDefault();e.stopPropagation();this.close(true);}else if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){const match=[...items.slice(index+1),...items.slice(0,index+1)].find(b=>b.textContent.trim().toLowerCase().startsWith(e.key.toLowerCase()));if(match){e.preventDefault();match.focus();}}});
  element.addEventListener('click',e=>{const b=e.target.closest('[data-file-action]');if(!b)return;const d=this.resolve(this.target);this.close(true);if(d)this.actions[b.dataset.fileAction]?.(d);});
  document.addEventListener('pointerdown',e=>{if(!element.hidden&&!element.contains(e.target))this.close(false);},true);
  document.addEventListener('focusin',e=>{if(!element.hidden&&!element.contains(e.target))this.close(false);});
  window.addEventListener('resize',()=>this.close(false));document.addEventListener('scroll',e=>{if(element.hidden||element.contains(e.target))return;const target=e.target===document?document.scrollingElement:e.target,previous=this.scrollState?.get(target);if(previous&&previous[0]===target.scrollTop&&previous[1]===target.scrollLeft)return;this.close(false);},true);
 }
 open(id,x,y,opener){
  const d=this.resolve(id);if(!d)return;this.close(false);this.scrollState=new Map();for(let el=opener;el;el=el.parentElement)this.scrollState.set(el,[el.scrollTop,el.scrollLeft]);this.target=id;this.opener=opener;this.previousExpanded=opener?.getAttribute('aria-expanded');opener?.setAttribute('aria-expanded','true');
  this.element.querySelector('[data-file-title]').textContent=d.name;const save=this.element.querySelector('[data-file-action=save]');if(save)save.disabled=!!d.fileSaving;this.element.hidden=false;
  this.element.style.left='0px';this.element.style.top='0px';const r=this.element.getBoundingClientRect();this.element.style.left=Math.max(8,Math.min(x,innerWidth-r.width-8))+'px';this.element.style.top=Math.max(8,Math.min(y,innerHeight-r.height-8))+'px';
  this.element.querySelector('[role=menuitem]:not(:disabled)')?.focus();
 }
 close(focus=false){if(this.element.hidden)return;this.element.hidden=true;if(this.previousExpanded!=null)this.opener?.setAttribute('aria-expanded',this.previousExpanded);else this.opener?.removeAttribute('aria-expanded');if(focus){if(this.opener?.isConnected)this.opener.focus();else document.querySelector('#tabs [aria-selected=true]')?.focus();}this.target=null;}
 button(id,button){button.setAttribute('aria-haspopup','menu');button.setAttribute('aria-controls',this.element.id);button.onclick=e=>{e.stopPropagation();const r=button.getBoundingClientRect();this.open(id(),r.left,r.bottom,button);};}
}
