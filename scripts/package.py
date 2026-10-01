#!/usr/bin/env python3
"""Package a tested TYPEBENCH static release; does not build or publish."""
from pathlib import Path
import argparse, hashlib, json, zipfile
root=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser()
parser.add_argument('--output',type=Path,default=root.parent/'deliverables')
args=parser.parse_args()
version=json.loads((root/'package.json').read_text())['version']
allowed={'assets','src','scripts','tests','docs','licenses'}
root_files={'index.html','sw.js','README.md','CHANGELOG.md','LICENSE','THIRD-PARTY-NOTICES.md','package.json','package-lock.json','.gitignore','.editorconfig'}
files=sorted(p for p in root.rglob('*') if p.is_file() and (p.relative_to(root).parts[0] in allowed or p.relative_to(root).as_posix() in root_files) and '__pycache__' not in p.parts and not p.name.endswith('-failure.png'))
assert (root/'index.html') in files
for name in ['app.js','search-worker.js','markdown-worker.js','zip-worker.js','app.css']:
 assert (root/'assets'/name) in files,name
manifest=''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.relative_to(root).as_posix()+'\n' for p in files)
(root/'SHA256SUMS').write_text(manifest)
files.append(root/'SHA256SUMS')
args.output.mkdir(parents=True,exist_ok=True)
dest=args.output/f'TYPEBENCH-v{version}-github-ready.zip'
with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
 for p in files:archive.write(p,p.relative_to(root).as_posix())
with zipfile.ZipFile(dest) as archive:
 assert archive.testzip() is None
 assert 'index.html' in archive.namelist()
 assert not any('node_modules/' in name for name in archive.namelist())
print(f'{dest}\n{dest.stat().st_size:,} bytes; {len(files)} files; ZIP verified')
