// TYPEBENCH — GPL-3.0-only. Native disclosure buttons and nested lists, with arrow navigation.
import {allFolders,parentPath,basename,ancestors} from './folder-data.js';
export class FolderTree{
 constructor({element,open,toggle,fileMenu,folderMenu}){Object.assign(this,{element,open,toggle,fileMenu,folderMenu});this.signature='';
  element.addEventListener('keydown',e=>{const button=e.target.closest('[data-tree-key]');if(!button||e.ctrlKey||e.metaKey||e.altKey)return;const rows=[...element.querySelectorAll('[data-tree-key]')].filter(b=>!b.closest('[hidden]')),i=rows.indexOf(button),folder=button.dataset.folder;
   if(['ArrowUp','ArrowDown','Home','End'].includes(e.key)){e.preventDefault();rows[e.key==='Home'?0:e.key==='End'?rows.length-1:Math.max(0,Math.min(rows.length-1,i+(e.key==='ArrowDown'?1:-1)))]?.focus();}
   else if(e.key==='ArrowRight'&&folder){e.preventDefault();if(button.getAttribute('aria-expanded')==='false')this.toggle(folder,false);else rows[i+1]?.focus();}
   else if(e.key==='ArrowLeft'){e.preventDefault();if(folder&&button.getAttribute('aria-expanded')==='true')this.toggle(folder,true);else{const path=parentPath(button.dataset.path);[...element.querySelectorAll('.folder-row')].find(b=>b.dataset.folder===path)?.focus();}}
  });
 }
 render(documents,folders,collapsed,active){
  const signature=JSON.stringify([documents,folders,[...collapsed].sort(),active]);if(signature===this.signature)return;this.signature=signature;
  const focus=document.activeElement?.dataset.treeKey,scroll=this.element.scrollTop;
  const dirs=allFolders(documents.map(d=>d.name),folders),nodes=new Map([['',{folders:[],files:[]}]]);
  for(const path of dirs)nodes.set(path,{folders:[],files:[]});
  for(const path of dirs)nodes.get(parentPath(path)).folders.push(path);
  for(const d of documents)nodes.get(parentPath(d.name)).files.push(d);
  const order=(a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'});
  let counter=0;
  const render=path=>{const ul=document.createElement('ul');ul.className='folder-children';const node=nodes.get(path);
   for(const child of node.folders.sort(order)){
    const li=document.createElement('li'),row=document.createElement('div');row.className='folder-entry';row.dataset.folderPath=child;
    const b=document.createElement('button');b.className='folder-row';b.dataset.treeKey='folder:'+child;b.dataset.folder=child;b.dataset.path=child;b.title=child;b.setAttribute('aria-label','Folder '+child);b.setAttribute('aria-expanded',String(!collapsed.has(child)));
    const arrow=document.createElement('span');arrow.textContent=collapsed.has(child)?'▸':'▾';arrow.className='folder-arrow';arrow.setAttribute('aria-hidden','true');const label=document.createElement('span');label.className='file-name';label.textContent=basename(child);b.append(arrow,label);b.onclick=()=>this.toggle(child,!collapsed.has(child));
    const more=document.createElement('button');more.className='file-more';more.textContent='⋯';more.setAttribute('aria-label','Folder actions for '+child);this.folderMenu.button(()=>child,more);
    const nested=render(child);nested.id='folder-group-'+counter++;nested.hidden=collapsed.has(child);b.setAttribute('aria-controls',nested.id);row.append(b,more);li.append(row,nested);ul.append(li);
   }
   for(const d of node.files.sort((a,b)=>order(basename(a.name),basename(b.name)))){
    const li=document.createElement('li'),row=document.createElement('div');row.className='file-entry';row.dataset.documentId=d.id;
    const b=document.createElement('button');b.className='file-row'+(d.id===active?' active':'');b.dataset.treeKey='file:'+d.id;b.dataset.path=d.name;b.title=d.name;b.setAttribute('aria-label',d.name);b.setAttribute('aria-current',String(d.id===active));
    const icon=document.createElement('span');icon.className='file-icon';icon.textContent=d.language==='markdown'?'M↓':d.language==='text'?'≡':'‹›';icon.setAttribute('aria-hidden','true');const name=document.createElement('span');name.className='file-name';name.textContent=basename(d.name);b.append(icon,name);
    if(d.modified){const dot=document.createElement('span');dot.className='modified';dot.textContent='•';dot.setAttribute('aria-label','modified');b.append(dot);}b.onclick=()=>this.open(d.id);
    const more=document.createElement('button');more.className='file-more';more.textContent='⋯';more.setAttribute('aria-label','File actions for '+d.name);this.fileMenu.button(()=>d.id,more);row.append(b,more);li.append(row);ul.append(li);
   }return ul;
  };
  this.element.replaceChildren(render(''));this.element.scrollTop=scroll;
  if(focus)[...this.element.querySelectorAll('[data-tree-key]')].find(b=>b.dataset.treeKey===focus)?.focus();
 }
}
