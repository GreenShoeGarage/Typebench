// TYPEBENCH — GPL-3.0-only.
export const languageList = [
 ['text','Plain text',['txt','text','log']],['markdown','Markdown',['md','markdown','mdown']],
 ['html','HTML',['html','htm']],['css','CSS',['css']],['javascript','JavaScript',['js','mjs','cjs','jsx']],
 ['typescript','TypeScript',['ts','tsx','mts','cts']],['json','JSON',['json','jsonld']],['python','Python',['py','pyw']],
 ['c','C',['c']],['cpp','C++',['cpp','cc','cxx','h','hpp','hxx']],['java','Java',['java']],['csharp','C#',['cs']],
 ['go','Go',['go']],['rust','Rust',['rs']],['php','PHP',['php','phtml']],['ruby','Ruby',['rb','rake']],
 ['shell','Bash / shell',['sh','bash','zsh']],['powershell','PowerShell',['ps1','psm1','psd1']],['sql','SQL',['sql']],
 ['yaml','YAML',['yaml','yml']],['toml','TOML',['toml']],['xml','XML',['xml','svg','xsl','xsd']],
 ['processing','Processing',['pde']],['arduino','Arduino',['ino']]
];
export function detectLanguage(name) {
 const base=name.toLowerCase().split('/').pop();
 if(['.bashrc','.bash_profile','.zshrc','.profile'].includes(base))return 'shell';
 if(['gemfile','rakefile'].includes(base))return 'ruby';
 return languageList.find(([,label,ext])=>ext.includes(base.split('.').pop()))?.[0]||'text';
}
export function fenceLanguage(name='') {
 const n=name.toLowerCase().split(/\s+/)[0];
 return ({'c++':'cpp','c#':'csharp',cs:'csharp',bash:'shell',sh:'shell',ps:'powershell',pwsh:'powershell',js:'javascript',ts:'typescript',py:'python',rb:'ruby',pde:'processing',ino:'arduino',yml:'yaml',md:'markdown'})[n] || (languageList.some(([id])=>id===n)?n:detectLanguage('code.'+n));
}
