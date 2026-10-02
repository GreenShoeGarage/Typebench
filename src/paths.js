// TYPEBENCH — GPL-3.0-only.
export function validPath(value) {
  const path = value.trim().replace(/\\/g, '/');
  if (!path || path.startsWith('/') || /[\x00-\x1f<>:"|?*]/.test(path) || path.split('/').some(p=>!p || p==='.' || p==='..' || /[. ]$/.test(p))) throw new Error('Use a relative filename such as notes.md or sketches/blink.ino. Avoid reserved characters and .. path segments.');
  if(path.split('/').some(p=>/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(p))) throw new Error('That filename is reserved on Windows. Choose another name.');
  return path;
}
export function uniqueName(name, names) {
  if (!names.includes(name)) return name;
  const slash=name.lastIndexOf('/'), dot=name.lastIndexOf('.');
  const stem=dot>slash ? name.slice(0,dot) : name, ext=dot>slash ? name.slice(dot) : '';
  let n=2;
  while(names.includes(`${stem} (${n})${ext}`)) n++;
  return `${stem} (${n})${ext}`;
}
