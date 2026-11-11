import JSZip from 'jszip';

export const uid = () => crypto.randomUUID();
export const extension = name => (name.split('.').pop() || '').toLowerCase();
export const imageExtensions = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'bmp', 'ico']);
export const audioExtensions = new Set(['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac']);
const binaryExtensions = new Set([...imageExtensions, ...audioExtensions, 'woff', 'woff2', 'ttf', 'otf', 'pdf', 'mp4', 'webm', 'zip']);
export const isBinary = name => binaryExtensions.has(extension(name));
export const fileType = name => imageExtensions.has(extension(name)) ? 'image' : audioExtensions.has(extension(name)) ? 'audio' : isBinary(name) ? 'binary' : 'text';
export const mimeFor = name => ({png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',avif:'image/avif',svg:'image/svg+xml',mp3:'audio/mpeg',wav:'audio/wav',ogg:'audio/ogg',m4a:'audio/mp4',aac:'audio/aac',html:'text/html',css:'text/css',js:'text/javascript',json:'application/json'})[extension(name)] || 'application/octet-stream';
export const blankProject = name => ({ id: uid(), name: name.trim() || 'Мой проект', nodes: [], updatedAt: Date.now() });
export function demoProject() {
  const p = blankProject('aurora-studio');
  const files = [
    ['index.html', `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Aurora — digital playground</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="glow"></div>
  <header class="nav">
    <a class="brand" href="#home"><span class="brand-mark">✳</span> aurora<span class="dot">.</span></a>
    <nav><a href="#about">О нас</a><a href="#work">Проекты</a><a href="#contact">Контакты</a></nav>
    <a class="nav-cta" href="mailto:hello@example.com">Давайте поговорим ↗</a>
  </header>
  <main id="home">
    <div class="eyebrow"><span class="live-dot"></span> ДИЗАЙН-СТУДИЯ НОВОГО ПОКОЛЕНИЯ</div>
    <h1>Создаём цифровое<br/><em>будущее</em> вместе<span class="period">.</span></h1>
    <p class="intro">Превращаем смелые идеи в продукты, которые<br/>вдохновляют, удивляют и меняют правила игры.</p>
    <div class="actions"><a class="primary" href="#work">Смотреть проекты <span>↗</span></a><a class="secondary" href="#about">Узнать больше <span>→</span></a></div>
    <div class="bottom"><div class="scroll">↓ &nbsp; ЛИСТАЙТЕ ВНИЗ</div><div class="counter">01 <span>/</span> 03</div></div>
  </main>
  <script src="script.js"></script>
</body>
</html>`],
    ['style.css', `:root { font-family: 'Manrope', sans-serif; color: #f7f9fc; background: #101629; }
* { box-sizing: border-box; } html { scroll-behavior: smooth; } body { margin: 0; min-height: 100vh; overflow-x: hidden; background: radial-gradient(ellipse at 74% 48%, #203b60 0%, #17263f 36%, #101629 73%); }
a { color: inherit; text-decoration: none; } .glow { position: fixed; width: 400px; height: 400px; right: 10%; top: 27%; background: #4c76c9; filter: blur(140px); opacity: .19; pointer-events: none; }
.nav { height: 88px; max-width: 1440px; margin: auto; padding: 0 6%; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #ffffff1a; }
.brand { font-size: 25px; font-weight: 800; letter-spacing: -1.5px; }.brand-mark { color: #a3ffca; margin-right: 9px; }.dot,.period { color: #a3ffca; }
nav { display: flex; gap: 38px; font-size: 13px; color: #aab4c8; } nav a:hover, .secondary:hover { color: #a3ffca; }.nav-cta { font-size: 12px; font-weight: 700; padding: 12px 19px; border: 1px solid #ffffff55; border-radius: 6px; }
main { position: relative; min-height: calc(100vh - 88px); max-width: 1440px; margin: auto; padding: 10vh 6% 35px; }.eyebrow { color: #a3ffca; letter-spacing: .19em; font-size: 11px; font-weight: 800; display:flex; align-items:center; gap:11px; }.live-dot { width:7px; height:7px; border-radius:50%; background:#a3ffca; box-shadow:0 0 12px #a3ffca; }
h1 { font-size: clamp(48px, 6.5vw, 105px); line-height: 1.14; letter-spacing: -.075em; margin: 29px 0 27px; font-weight: 700; } h1 em { font-style: normal; color: #a3ffca; }.intro { font-family:'DM Sans',sans-serif; color: #aebbd0; font-size: 16px; line-height: 1.9; }.actions { display: flex; gap: 33px; align-items: center; margin-top: 35px; }.primary { display: inline-flex; align-items: center; gap: 38px; padding: 17px 22px; border-radius: 6px; background: #a3ffca; color: #102338; font-size: 13px; font-weight: 800; }.primary:hover { background: #d0ffe1; }.secondary { font-size: 13px; font-weight: 700; }.secondary span { margin-left: 9px; }.bottom { display:flex; justify-content:space-between; align-items:center; margin-top: 9vh; color:#8e9cb5; font-size: 10px; letter-spacing:.2em; }.counter {font-size:17px; letter-spacing:0; color:#fff;}.counter span {color:#70809b; margin:0 8px;} @media(max-width:700px){.nav{height:70px}.nav nav,.nav-cta{display:none}main{padding-top:14vh}h1{letter-spacing:-.06em}.bottom{margin-top:15vh}}
`],
    ['script.js', `// Здесь начинается ваша история ✨
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) { event.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});
console.log('Aurora готова к вашим идеям!');
`]
  ];
  p.nodes = files.map(([name, content]) => ({id: uid(), parentId: null, name, kind:'file', content, mime: mimeFor(name)}));
  return p;
}
export const childrenOf = (nodes, id) => nodes.filter(n => n.parentId === id).sort((a,b) => (a.kind === 'folder' ? -1 : 1) - (b.kind === 'folder' ? -1 : 1) || a.name.localeCompare(b.name, 'ru', {numeric:true}));
export function pathOf(node, nodes) {
  const parts = [node.name]; let parent = node.parentId; const seen = new Set([node.id]);
  while (parent) { const p = nodes.find(n => n.id === parent); if (!p || seen.has(p.id)) break; parts.unshift(p.name); seen.add(p.id); parent = p.parentId; }
  return parts.join('/');
}
export function validName(name) { return !!name?.trim() && !/[\\/\0]/.test(name) && name !== '.' && name !== '..'; }
export function availableName(nodes, parentId, name) {
  if (!nodes.some(n => n.parentId === parentId && n.name.toLowerCase() === name.toLowerCase())) return name;
  const dot = name.lastIndexOf('.'); const stem = dot > 0 ? name.slice(0,dot) : name; const ext = dot > 0 ? name.slice(dot) : '';
  let i = 2; while(nodes.some(n => n.parentId === parentId && n.name.toLowerCase() === `${stem} (${i})${ext}`.toLowerCase())) i++;
  return `${stem} (${i})${ext}`;
}
export function removeBranch(nodes, id) {
  const removed = new Set([id]); let changed = true;
  while (changed) { changed = false; for (const n of nodes) if (removed.has(n.parentId) && !removed.has(n.id)) { removed.add(n.id); changed = true; } }
  return {nodes: nodes.filter(n => !removed.has(n.id)), removed};
}
export function canMove(nodes, id, target) {
  if (id === target) return false;
  let cursor = target; const seen = new Set();
  while(cursor) { if (cursor === id || seen.has(cursor)) return false; seen.add(cursor); cursor = nodes.find(n => n.id === cursor)?.parentId; }
  return true;
}
export function cleanPath(path) {
  const parts = path.replaceAll('\\','/').split('/');
  if (parts.some(p => p === '..' || p === '\0')) return null;
  return parts.filter(p => p && p !== '.').join('/');
}
export async function entriesFromFiles(files, folder = false) {
  return Promise.all(Array.from(files).map(async file => ({path: cleanPath(folder ? file.webkitRelativePath || file.name : file.name), data: isBinary(file.name) ? file : await file.text(), mime: file.type || mimeFor(file.name)})));
}
export async function entriesFromZip(file) {
  const zip = await JSZip.loadAsync(file); const entries = [];
  for (const [raw, item] of Object.entries(zip.files)) {
    if (item.unsafeOriginalName && !cleanPath(item.unsafeOriginalName)) continue;
    const path = cleanPath(raw); if (!path || raw.startsWith('__MACOSX/') || path.split('/').some(s => s === '.DS_Store')) continue;
    if (item.dir) entries.push({path, folder:true});
    else { const name = path.split('/').pop(); entries.push({path, data: isBinary(name) ? new Blob([await item.async('uint8array')], {type:mimeFor(name)}) : await item.async('string'), mime: mimeFor(name)}); }
  }
  return entries;
}
export function addEntries(project, entries, stripRoot = false) {
  const nodes = project.nodes.map(n => ({...n}));
  const paths = entries.filter(e => e.path).map(e => e.path.split('/'));
  const commonRoot = stripRoot && paths.length && paths.some(parts => parts.length > 1) && paths.every(parts => parts[0] === paths[0][0] && (parts.length > 1 || entries.some(e => e.path === parts[0] && e.folder))) ? paths[0][0] : null;
  for (const entry of entries) {
    if (!entry.path) continue;
    const parts = entry.path.split('/'); if (commonRoot) parts.shift(); if (!parts.length) continue;
    let parentId = null;
    for (let i=0; i<parts.length; i++) {
      const name = parts[i]; const folder = i < parts.length - 1 || entry.folder;
      let existing = nodes.find(n => n.parentId === parentId && n.name === name);
      if (existing && existing.kind !== (folder ? 'folder' : 'file')) existing = null;
      if (existing && !folder && i === parts.length-1) { // Imported files replace files with the same path.
        existing.content = entry.data; existing.mime = entry.mime;
      } else if (!existing) {
        existing = {id:uid(), parentId, name: availableName(nodes,parentId,name), kind:folder?'folder':'file', ...(folder ? {} : {content:entry.data, mime:entry.mime})}; nodes.push(existing);
      }
      parentId = existing.id;
    }
  }
  return {...project, name:commonRoot && stripRoot ? commonRoot : project.name, nodes, updatedAt:Date.now()};
}
export async function exportZip(project) {
  const zip = new JSZip(); const root = zip.folder(project.name.replace(/[\\/]/g,'-') || 'project');
  for (const node of project.nodes) { const path = pathOf(node,project.nodes); if(node.kind === 'folder') root.folder(path); else root.file(path, node.content ?? ''); }
  return zip.generateAsync({type:'blob', compression:'DEFLATE', compressionOptions:{level:6}});
}
export function download(blob, name) {
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export function sizeOf(node) { return node.content instanceof Blob ? node.content.size : new Blob([node.content || '']).size; }
export function formatSize(bytes) { return bytes < 1024 ? `${bytes} Б` : bytes < 1048576 ? `${(bytes/1024).toFixed(1)} КБ` : `${(bytes/1048576).toFixed(1)} МБ`; }
const DB_NAME = 'webstudio-projects';
export function openDatabase() {
  return new Promise((resolve,reject) => { const req = indexedDB.open(DB_NAME,1); req.onupgradeneeded = () => req.result.createObjectStore('projects',{keyPath:'id'}); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
}
export async function listProjects() {
  const db = await openDatabase();
  return new Promise((resolve,reject) => { const tx = db.transaction('projects','readonly'); const req = tx.objectStore('projects').getAll(); req.onsuccess = () => resolve(req.result.sort((a,b) => b.updatedAt-a.updatedAt)); req.onerror = () => reject(req.error); tx.oncomplete = () => db.close(); });
}
export async function loadProject() {
  const projects = await listProjects();
  return projects.find(p => p.id === localStorage.getItem('webstudio-active')) || projects[0] || null;
}
export async function saveProject(project) {
  const db = await openDatabase();
  return new Promise((resolve,reject) => { const tx = db.transaction('projects','readwrite'); tx.objectStore('projects').put(project); tx.oncomplete = () => {db.close(); resolve();}; tx.onerror = () => {db.close(); reject(tx.error);}; });
}
export async function clearProject(id) {
  const db = await openDatabase();
  return new Promise((resolve,reject) => { const tx = db.transaction('projects','readwrite'); tx.objectStore('projects').delete(id); tx.oncomplete = () => {db.close(); resolve();}; tx.onerror = () => {db.close(); reject(tx.error);}; });
}
