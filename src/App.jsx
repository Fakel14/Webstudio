import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {openSearchPanel} from '@codemirror/search';
import {
  Activity, Archive, ArrowDownToLine, ArrowLeft, ArrowRight, AudioLines, Check, ChevronDown, ChevronRight,
  CircleHelp, CirclePlus, Code2, Download, Ellipsis, ExternalLink, File, FileAudio, FileCode2, FileImage,
  FileJson, FilePlus2, Folder, FolderClosed, FolderOpen, FolderPlus, Globe2, HardDriveDownload, Image,
  LayoutPanelLeft, Maximize2, Minimize2, MoreHorizontal, Music2, PanelLeftClose, PanelLeftOpen, Pencil,
  Play, Plus, RefreshCw, Save, Search, Settings2, Sparkles, Trash2, Upload, X, Zap
} from 'lucide-react';
import CodeEditor from './CodeEditor.jsx';
import {
  addEntries, audioExtensions, availableName, blankProject, canMove, childrenOf, clearProject, demoProject,
  download, entriesFromFiles, entriesFromZip, exportZip, extension, fileType, formatSize, imageExtensions,
  isBinary, listProjects, loadProject, mimeFor, pathOf, removeBranch, saveProject, sizeOf, uid, validName
} from './project.js';
import {buildPreview, previewPage, resolveProjectPath} from './preview.js';

const newNode = (name,kind,parentId) => ({id:uid(), name,kind,parentId,...(kind === 'file' ? {content:'',mime:mimeFor(name)} : {})});
function AssetUrl({blob,children}) { const [url,setUrl] = useState(''); useEffect(() => {if(!(blob instanceof Blob)) return; const next = URL.createObjectURL(blob); setUrl(next); return () => URL.revokeObjectURL(next);},[blob]); return children(url); }
function KindIcon({node, size=16}) {
  if(node.kind === 'folder') return <Folder size={size} className="folder-icon" fill="currentColor" strokeWidth={1.3}/>;
  const ext = extension(node.name);
  if(imageExtensions.has(ext)) return node.content instanceof Blob ? <AssetUrl blob={node.content}>{url => url ? <img className="tree-thumbnail" src={url} alt=""/> : <FileImage size={size}/>}</AssetUrl> : <FileImage size={size} className="type-image"/>;
  if(audioExtensions.has(ext)) return <FileAudio size={size} className="type-audio"/>;
  if(ext === 'html' || ext === 'htm') return <span className="type-badge type-html">◇</span>;
  if(ext === 'css' || ext === 'scss') return <span className="type-badge type-css">#</span>;
  if(['js','jsx','ts','tsx','mjs'].includes(ext)) return <span className="type-badge type-js">JS</span>;
  if(ext === 'json') return <FileJson size={size} className="type-json"/>;
  if(ext === 'svg') return <FileImage size={size} className="type-image"/>;
  return <File size={size} className="type-default"/>;
}
function IconButton({icon:Icon,title,onClick,className='',disabled=false}) {return <button type="button" className={`icon-button ${className}`} title={title} aria-label={title} onClick={onClick} disabled={disabled}><Icon size={17} strokeWidth={1.8}/></button>}

function MediaViewer({node}) {
  const [dimensions,setDimensions] = useState(null); const [duration,setDuration] = useState(null);
  useEffect(() => {setDimensions(null);setDuration(null);},[node.id]);
  const type = fileType(node.name);
  return <div className="media-viewer"><div className="media-panel">
    <div className="media-topline"><span className="media-label">{type === 'image' ? 'ПРОСМОТР ИЗОБРАЖЕНИЯ' : type === 'audio' ? 'АУДИОФАЙЛ' : 'ДВОИЧНЫЙ ФАЙЛ'}</span><span className="media-ext">.{extension(node.name)}</span></div>
    <AssetUrl blob={node.content}>{url => type === 'image' ? <div className="image-stage">{url && <img src={url} alt={node.name} onLoad={e => setDimensions(`${e.currentTarget.naturalWidth} × ${e.currentTarget.naturalHeight} px`)}/>}</div> : type === 'audio' ? <div className="audio-stage"><div className="audio-art"><AudioLines size={64} strokeWidth={1.2}/></div><div className="audio-heading">{node.name}</div><p>Предпрослушивание аудиофайла</p>{url && <audio controls preload="metadata" src={url} onLoadedMetadata={e => {const d=e.currentTarget.duration;if(Number.isFinite(d)) setDuration(`${Math.floor(d/60)}:${String(Math.floor(d%60)).padStart(2,'0')}`)}}>Ваш браузер не поддерживает воспроизведение аудио.</audio>}</div> : <div className="binary-stage"><File size={54}/><p>Для этого файла недоступен текстовый редактор</p></div>}</AssetUrl>
    <div className="media-details"><div><span>ИМЯ ФАЙЛА</span><strong>{node.name}</strong></div><div><span>РАЗМЕР</span><strong>{formatSize(sizeOf(node))}</strong></div>{(dimensions || duration) && <div><span>{dimensions ? 'РАЗРЕШЕНИЕ' : 'ДЛИТЕЛЬНОСТЬ'}</span><strong>{dimensions || duration}</strong></div>}</div>
  </div></div>;
}

function TreeRow({node,depth,nodes,expanded,onToggle,onOpen,onMenu,activeId,search,dragId,setDragId,dropId,setDropId,onMove}) {
  const children = node.kind === 'folder' ? childrenOf(nodes,node.id) : [];
  const matched = !search || node.name.toLowerCase().includes(search) || (node.kind === 'folder' && children.some(c => branchMatches(c,nodes,search)));
  if(!matched) return null;
  const open = search ? true : expanded.has(node.id);
  return <>
    <div className={`tree-row ${activeId===node.id?'selected':''} ${dropId===node.id?'drop-target':''}`} style={{paddingLeft: `${14+depth*17}px`}}
      draggable onDragStart={e => {e.stopPropagation();e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',node.id);setDragId(node.id)}} onDragEnd={() => {setDragId(null);setDropId(null)}}
      onDragOver={e => {if(node.kind==='folder' && dragId && canMove(nodes,dragId,node.id)) {e.preventDefault();e.stopPropagation();setDropId(node.id)}}}
      onDragLeave={e => {if(!e.currentTarget.contains(e.relatedTarget)) setDropId(null)}}
      onDrop={e => {e.preventDefault();e.stopPropagation();onMove(dragId,node.id);setDropId(null)}}
      onClick={() => node.kind==='folder' ? onToggle(node.id) : onOpen(node.id)}
      onContextMenu={e => {e.preventDefault();onMenu(e,node)}} title={node.name}>
      <span className="tree-chevron">{node.kind==='folder' ? (open?<ChevronDown size={14}/>:<ChevronRight size={14}/>) : null}</span>
      {node.kind==='folder' && open ? <FolderOpen size={16} className="folder-icon" fill="currentColor" strokeWidth={1.3}/> : <KindIcon node={node}/>}
      <span className="tree-name">{node.name}</span>
      <button className="row-more" title="Действия" onClick={e => {e.stopPropagation();onMenu(e,node)}}><MoreHorizontal size={16}/></button>
    </div>
    {node.kind==='folder' && open && children.map(child => <TreeRow key={child.id} node={child} depth={depth+1} nodes={nodes} expanded={expanded} onToggle={onToggle} onOpen={onOpen} onMenu={onMenu} activeId={activeId} search={search} dragId={dragId} setDragId={setDragId} dropId={dropId} setDropId={setDropId} onMove={onMove}/>)}
  </>;
}
function branchMatches(node,nodes,search) {return node.name.toLowerCase().includes(search) || (node.kind==='folder' && childrenOf(nodes,node.id).some(c => branchMatches(c,nodes,search)))}

export default function App() {
  const [project,setProject] = useState(null); const projectRef = useRef(null);
  const [loading,setLoading] = useState(true); const [saveState,setSaveState] = useState('saved');
  const [mode,setMode] = useState('code'); const [activeId,setActiveId] = useState(null); const [tabs,setTabs] = useState([]);
  const [expanded,setExpanded] = useState(new Set()); const [search,setSearch] = useState('');
  const [sidebarVisible,setSidebarVisible] = useState(true); const [sidebarWidth,setSidebarWidth] = useState(268);
  const [dialog,setDialog] = useState(null); const [dialogValue,setDialogValue] = useState('');
  const [menu,setMenu] = useState(null); const [toast,setToast] = useState(null);
  const [dragId,setDragId] = useState(null); const [dropId,setDropId] = useState(null);
  const [previewId,setPreviewId] = useState(null); const [frame,setFrame] = useState(null); const [refresh,setRefresh] = useState(0);
  const [fullscreen,setFullscreen] = useState(false); const [savedProjects,setSavedProjects] = useState([]);
  const saveTimer = useRef(null); const saveQueue = useRef(Promise.resolve()); const toastTimer = useRef(null);
  const editorStates = useRef(new Map()); const editorView = useRef(null); const previewRef = useRef(null); const frameRef = useRef(null);
  const fileInput = useRef(null); const folderInput = useRef(null); const zipInput = useRef(null); const searchInput = useRef(null); const importAsProject = useRef(false);

  const notify = useCallback((message,kind='success') => {setToast({message,kind});clearTimeout(toastTimer.current);toastTimer.current=setTimeout(() => setToast(null),3800)},[]);
  useEffect(() => {loadProject().then(p => {if(p) {projectRef.current=p;setProject(p);const first=p.nodes.find(n => n.kind==='file' && n.name==='index.html')?.id || p.nodes.find(n => n.kind==='file')?.id || null;setActiveId(first);setTabs(first?[first]:[]);setExpanded(new Set(p.nodes.filter(n => n.kind==='folder').map(n => n.id)));}setLoading(false)}).catch(() => {setLoading(false);notify('Не удалось открыть IndexedDB. Проект может не сохраниться.','error')});},[notify]);
  const flushSave = useCallback(() => {
    clearTimeout(saveTimer.current); const snapshot=projectRef.current; if(!snapshot) return Promise.resolve();
    saveQueue.current=saveQueue.current.catch(() => {}).then(() => saveProject(snapshot));
    return saveQueue.current.then(() => {if(projectRef.current===snapshot) setSaveState('saved')}).catch(() => {setSaveState('error');notify('Ошибка сохранения. Проверьте доступное место в браузере.','error')});
  },[notify]);
  const changeProject = useCallback(fn => {
    const next = fn(projectRef.current); if(!next || next===projectRef.current) return;
    next.updatedAt=Date.now(); projectRef.current=next;setProject(next);setSaveState('saving');
    clearTimeout(saveTimer.current);saveTimer.current=setTimeout(flushSave,650);
  },[flushSave]);
  const activateProject = useCallback(async next => {
    const current=projectRef.current;await flushSave();if(current?.id===next.id) next=projectRef.current;clearTimeout(saveTimer.current); projectRef.current=next;setProject(next);localStorage.setItem('webstudio-active',next.id);
    editorStates.current.clear();const first=next.nodes.find(n => n.kind==='file' && n.name==='index.html')?.id || next.nodes.find(n => n.kind==='file')?.id || null;setTabs(first?[first]:[]);setActiveId(first);
    setExpanded(new Set(next.nodes.filter(n => n.kind==='folder').map(n => n.id)));setPreviewId(null);setMode('code');setSearch('');setDialog(null);setSaveState('saving');
    saveQueue.current=saveQueue.current.catch(() => {}).then(() => saveProject(next));
    try {await saveQueue.current;setSaveState('saved')} catch {setSaveState('error');notify('Не удалось сохранить проект','error')}
  },[flushSave,notify]);
  useEffect(() => {const handle= e => {if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='s') {e.preventDefault();flushSave();notify('Проект сохранён')} if((e.ctrlKey||e.metaKey) && e.shiftKey && e.key.toLowerCase()==='f') {e.preventDefault();searchInput.current?.focus()} if(e.key==='Escape') setMenu(null)};window.addEventListener('keydown',handle);return () => window.removeEventListener('keydown',handle)},[flushSave,notify]);
  useEffect(() => {if(!menu)return;const dismiss=() => setMenu(null);window.addEventListener('pointerdown',dismiss);return () => window.removeEventListener('pointerdown',dismiss)},[menu]);
  useEffect(() => {const onChange=() => {if(!document.fullscreenElement) setFullscreen(false)};document.addEventListener('fullscreenchange',onChange);return () => document.removeEventListener('fullscreenchange',onChange)},[]);
  useEffect(() => {const onMessage=e => {if(e.source!==frameRef.current?.contentWindow || e.data?.type!=='webstudio:navigate' || !projectRef.current)return;const current=projectRef.current.nodes.find(n => n.id===previewId);if(!current)return;const path=resolveProjectPath(e.data.href,pathOf(current,projectRef.current.nodes));const target=projectRef.current.nodes.find(n => n.kind==='file' && pathOf(n,projectRef.current.nodes)===path && /\.html?$/i.test(n.name));if(target)setPreviewId(target.id)};window.addEventListener('message',onMessage);return () => window.removeEventListener('message',onMessage)},[previewId]);
  useEffect(() => {
    if(!project || mode!=='preview') return;
    const page = previewPage(project,previewId || activeId);
    if(!page) {setFrame(null);return;}
    const timer=setTimeout(() => {const next=buildPreview(project,pathOf(page,project.nodes));setFrame(old => {if(old)setTimeout(old.dispose,2000);return {...next,pageId:page.id,key:Date.now()}})},project.nodes.length ? 380 : 0);
    return () => clearTimeout(timer);
  },[project,mode,previewId,activeId,refresh]);
  useEffect(() => () => {frame?.dispose()},[frame]);
  const nodes=project?.nodes || []; const active=nodes.find(n => n.id===activeId && n.kind==='file');
  const activePath=active ? pathOf(active,nodes) : '';
  const currentPage=project && previewPage(project,previewId || activeId);
  const openFile=useCallback(id => {setActiveId(id);setTabs(t => t.includes(id)?t:[...t,id]);setMode('code');setSidebarVisible(true)},[]);
  const openDialog=(type,node=null) => {setMenu(null);setDialog({type,node});setDialogValue(type==='rename'?node?.name||'':type==='newProject'?'Мой проект':'')};
  const parentForCreate = () => {const node=nodes.find(n => n.id===activeId);return node?.kind==='folder'?node.id:node?.parentId || null};
  const submitDialog=async e => {
    e.preventDefault(); const {type,node}=dialog;
    if(type==='delete') {const {removed}=removeBranch(nodes,node.id);changeProject(p => ({...p,nodes:p.nodes.filter(n => !removed.has(n.id))}));setTabs(t=>t.filter(id=>!removed.has(id)));if(removed.has(activeId))setActiveId(null);for(const key of editorStates.current.keys()) if([...removed].some(id => key.startsWith(id+':'))) editorStates.current.delete(key);notify('Удалено: '+node.name);setDialog(null);return;}
    if(type==='newProject') {if(!validName(dialogValue.trim())){notify('Введите название без символов / и \\','error');return}await activateProject(blankProject(dialogValue));notify('Проект создан');return;}
    const name=dialogValue.trim();if(!validName(name)){notify('Введите имя без символов / и \\','error');return;}
    if(type==='rename') {
      if(nodes.some(n => n.id!==node.id && n.parentId===node.parentId && n.name.toLowerCase()===name.toLowerCase())){notify('Такое имя уже есть в этой папке','error');return;}
      changeProject(p => ({...p,nodes:p.nodes.map(n => n.id===node.id?{...n,name,mime:n.kind==='file'?mimeFor(name):undefined}:n)}));for(const key of editorStates.current.keys()) if(key.startsWith(node.id+':')) editorStates.current.delete(key);notify('Переименовано');
    } else {
      const parentId=node?.kind==='folder'?node.id:parentForCreate();
      if(nodes.some(n => n.parentId===parentId && n.name.toLowerCase()===name.toLowerCase())){notify('Такое имя уже есть в этой папке','error');return;}
      const created=newNode(name,type==='folder'?'folder':'file',parentId);
      changeProject(p => ({...p,nodes:[...p.nodes,created]}));if(parentId)setExpanded(prev=>new Set([...prev,parentId]));if(type==='file')openFile(created.id);notify(type==='file'?'Файл создан':'Папка создана');
    }
    setDialog(null);
  };
  const moveNode=(id,target) => {if(!id || !project || !canMove(nodes,id,target))return;const node=nodes.find(n=>n.id===id);if(!node || target===node.parentId)return;if(nodes.some(n=>n.id!==id && n.parentId===target && n.name.toLowerCase()===node.name.toLowerCase())){notify('Файл с таким именем уже есть в этой папке','error');return}changeProject(p=>({...p,nodes:p.nodes.map(n=>n.id===id?{...n,parentId:target}:n)}));if(target)setExpanded(v=>new Set([...v,target]));notify('Перемещено: '+node.name)};
  const importEntries=async (entries,asProject=false,sourceName='Импорт') => {
    if(!entries.length){notify('В выбранном источнике нет файлов','error');return}
    const p=asProject || !projectRef.current ? blankProject(sourceName.replace(/\.zip$/i,'')) : projectRef.current;
    const next=addEntries(p,entries,asProject);
    if(asProject || !projectRef.current) await activateProject(next);else changeProject(() => next);
    setExpanded(new Set(next.nodes.filter(n=>n.kind==='folder').map(n=>n.id)));
    if(!activeId || asProject) {const first=next.nodes.find(n=>n.kind==='file'&&n.name==='index.html')||next.nodes.find(n=>n.kind==='file');if(first)openFile(first.id)}
    notify(`Импортировано: ${entries.filter(e=>!e.folder).length} файлов`);
  };
  const onImport=async (e,kind) => {const files=Array.from(e.target.files||[]);e.target.value='';if(!files.length)return;const asProject=importAsProject.current;importAsProject.current=false;try {const entries=kind==='zip'?await entriesFromZip(files[0]):await entriesFromFiles(files,kind==='folder');await importEntries(entries,asProject,kind==='zip'?files[0].name:kind==='folder'?files[0].webkitRelativePath?.split('/')[0]:'Новый проект')}catch(err){console.error(err);notify('Ошибка импорта: '+err.message,'error')}};
  const chooseImport=(kind,asProject=false) => {setDialog(null);setMenu(null);importAsProject.current=asProject;({files:fileInput,folder:folderInput,zip:zipInput})[kind].current?.click()};
  const downloadProject=async () => {if(!project)return;try {notify('Подготавливаем ZIP-архив…');const blob=await exportZip(project);download(blob,`${project.name.replace(/[\\/]/g,'-')}.zip`);notify('Проект скачан в ZIP')}catch(err){notify('Не удалось создать архив: '+err.message,'error')}};
  const downloadFile=node => {download(node.content instanceof Blob?node.content:new Blob([node.content||''],{type:node.mime}),node.name);setMenu(null);notify('Файл скачан')};
  const showProjects=async () => {setMenu(null);try{setSavedProjects(await listProjects());openDialog('projects')}catch{notify('Не удалось загрузить список проектов','error')}};
  const deleteSaved=async p => {if(!window.confirm(`Удалить проект «${p.name}»? Это действие нельзя отменить.`))return;try{if(projectRef.current?.id===p.id) await flushSave();await clearProject(p.id);setSavedProjects(v=>v.filter(x=>x.id!==p.id));if(projectRef.current?.id===p.id){projectRef.current=null;setProject(null);setActiveId(null);setTabs([]);localStorage.removeItem('webstudio-active')}notify('Проект удалён')}catch{notify('Не удалось удалить проект','error')}};
  const setPreviewMode=() => {setPreviewId(previewPage(project,activeId)?.id||null);setMode('preview')};
  const reloadPreview=() => {setRefresh(v=>v+1);notify('Предпросмотр обновлён')};
  const toggleFullscreen=async () => {try {if(document.fullscreenElement) await document.exitFullscreen();else await previewRef.current.requestFullscreen();setFullscreen(!!document.fullscreenElement)} catch {notify('Полноэкранный режим недоступен','error')}};
  const beginResize=e => {e.preventDefault();const start=e.clientX,initial=sidebarWidth;const move=ev=>setSidebarWidth(Math.min(440,Math.max(210,initial+ev.clientX-start)));const end=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);document.body.classList.remove('resizing')};document.body.classList.add('resizing');window.addEventListener('pointermove',move);window.addEventListener('pointerup',end)};
  const showNodeMenu=(e,node) => {e.stopPropagation();setMenu({kind:'node',node,x:Math.min(e.clientX,window.innerWidth-210),y:Math.min(e.clientY,window.innerHeight-236)})};
  const showImportMenu=e=> {e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();setMenu({kind:'import',x:Math.min(r.left,window.innerWidth-210),y:r.bottom+7})};
  const tabsPresent=tabs.map(id=>nodes.find(n=>n.id===id && n.kind==='file')).filter(Boolean);
  const fileCount=nodes.filter(n=>n.kind==='file').length;

  return <div className="app">
    <input ref={fileInput} type="file" multiple hidden onChange={e=>onImport(e,'files')}/>
    <input ref={folderInput} type="file" multiple webkitdirectory="" directory="" hidden onChange={e=>onImport(e,'folder')}/>
    <input ref={zipInput} type="file" accept=".zip,application/zip" hidden onChange={e=>onImport(e,'zip')}/>
    <header className="app-header"><div className="header-left"><div className="logo-mark"><Code2 size={20} strokeWidth={2.3}/></div><span className="logo-text">web<span>studio</span><span className="logo-period">.</span></span><span className="header-divider"/><span className="header-project" onClick={showProjects} title="Все проекты">{project?.name || 'Рабочее пространство'} <ChevronDown size={13}/></span></div>
      <div className="header-right">{project && <><span className={`save-indicator ${saveState}`}><span className="status-dot"/>{saveState==='saved'?'Все изменения сохранены':saveState==='error'?'Ошибка сохранения':'Сохранение…'}</span><span className="header-separator"/><button className="header-action" onClick={showProjects}><FolderClosed size={16}/> <span>Проекты</span></button><button className="header-action" onClick={downloadProject}><Download size={16}/> <span>Экспорт ZIP</span></button></>}</div>
    </header>
    {loading ? <div className="loading-screen"><div className="loading-symbol"><Code2 size={28}/></div><span>Загружаем рабочее пространство…</span></div> : !project ? <div className="welcome"><div className="welcome-orbit orbit-one"/><div className="welcome-orbit orbit-two"/><div className="welcome-content"><div className="welcome-kicker"><span className="kicker-line"/> ВАША ИДЕЯ. ВАШ КОД. ВАШ САЙТ.</div><h1>Пространство для<br/><span>больших идей<span className="welcome-dot">.</span></span></h1><p>Пишите код, собирайте проекты и смотрите результат в реальном времени. Всё, что нужно для вашего следующего сайта, — в одном месте.</p><div className="welcome-actions"><button className="primary-button" onClick={()=>openDialog('newProject')}><Plus size={18}/> Новый проект <ArrowRight size={17}/></button><button className="outline-button" onClick={showProjects}><FolderOpen size={18}/> Открыть проект</button></div><div className="welcome-example" onClick={()=>activateProject(demoProject()).then(()=>notify('Демо-проект открыт'))}><span className="example-icon"><Sparkles size={18}/></span><div><strong>Впервые здесь?</strong><span>Откройте готовый пример и познакомьтесь с WebStudio</span></div><ArrowRight size={17}/></div></div><div className="welcome-visual" aria-hidden="true"><div className="visual-window"><div className="visual-top"><i/><i/><i/><span>index.html — aurora-studio</span></div><div className="visual-body"><div className="visual-rail"><span>⌁</span><span>▤</span><span>◫</span></div><div className="visual-code"><div><b>01</b><span className="syntax-purple">&lt;!DOCTYPE html&gt;</span></div><div><b>02</b><span className="syntax-red">&lt;html</span> <span className="syntax-gold">lang</span>=<span className="syntax-green">"ru"</span><span className="syntax-red">&gt;</span></div><div><b>03</b>&nbsp; <span className="syntax-red">&lt;head&gt;</span></div><div><b>04</b>&nbsp; &nbsp; <span className="syntax-red">&lt;title&gt;</span>Aurora<span className="syntax-red">&lt;/title&gt;</span></div><div><b>05</b>&nbsp; <span className="syntax-red">&lt;/head&gt;</span></div><div><b>06</b>&nbsp; <span className="syntax-red">&lt;body&gt;</span></div><div><b>07</b>&nbsp; &nbsp; <span className="syntax-red">&lt;h1&gt;</span>Создаём <span className="syntax-red">&lt;em&gt;</span></div><div><b>08</b>&nbsp; &nbsp; &nbsp; будущее<span className="syntax-red">&lt;/em&gt;&lt;/h1&gt;</span></div><div><b>09</b>&nbsp; <span className="syntax-red">&lt;/body&gt;</span></div><div><b>10</b><span className="syntax-red">&lt;/html&gt;</span></div></div></div></div><div className="visual-badge"><span className="badge-pulse"/> LIVE PREVIEW <ArrowRight size={15}/></div></div></div> :
    <div className="main-layout">
      {sidebarVisible && <aside className="sidebar" style={{width:sidebarWidth}}>
        <div className="sidebar-heading"><div className="sidebar-title"><span className="sidebar-title-icon"><LayoutPanelLeft size={15}/></span> ПРОВОДНИК</div><IconButton icon={PanelLeftClose} title="Скрыть проводник" onClick={()=>setSidebarVisible(false)}/></div>
        <div className="project-title"><div className="project-glyph"><Code2 size={18}/></div><div className="project-title-text"><strong>{project.name}</strong><span>{fileCount} {fileCount===1?'файл':'файлов'} · локальный проект</span></div><IconButton icon={MoreHorizontal} title="Проекты" onClick={showProjects}/></div>
        <div className="explorer-toolbar"><span>ФАЙЛЫ ПРОЕКТА</span><div><IconButton icon={FilePlus2} title="Новый файл" onClick={()=>openDialog('file')}/><IconButton icon={FolderPlus} title="Новая папка" onClick={()=>openDialog('folder')}/><IconButton icon={Upload} title="Импортировать" onClick={showImportMenu}/></div></div>
        <div className="file-search"><Search size={15}/><input ref={searchInput} placeholder="Найти файл…" value={search} onChange={e=>setSearch(e.target.value)}/>{search && <button onClick={()=>setSearch('')} aria-label="Очистить поиск"><X size={13}/></button>}</div>
        <div className={`tree-area ${dropId==='root'?'root-drop':''}`} onDragOver={e=>{if(dragId){e.preventDefault();setDropId('root')}}} onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setDropId(null)}} onDrop={e=>{e.preventDefault();moveNode(dragId,null);setDropId(null)}}>
          <div className="tree-root"><ChevronDown size={14}/><span>{project.name.toUpperCase()}</span><span className="tree-count">{nodes.length}</span></div>
          {childrenOf(nodes,null).map(node=><TreeRow key={node.id} node={node} depth={0} nodes={nodes} expanded={expanded} onToggle={id=>setExpanded(v=>{const n=new Set(v);n.has(id)?n.delete(id):n.add(id);return n})} onOpen={openFile} onMenu={showNodeMenu} activeId={activeId} search={search.toLowerCase()} dragId={dragId} setDragId={setDragId} dropId={dropId} setDropId={setDropId} onMove={moveNode}/>)}
          {!nodes.length && <div className="tree-empty"><FolderPlus size={23}/><span>Здесь пока пусто</span><button onClick={()=>openDialog('file')}>Создать первый файл</button></div>}
          {search && !nodes.some(n=>n.parentId===null && branchMatches(n,nodes,search.toLowerCase())) && <div className="search-empty">Файлы не найдены</div>}
        </div>
        <div className="sidebar-bottom"><div className="sidebar-tip"><span><Zap size={14}/></span><div><strong>Быстрый старт</strong><p>Создайте index.html и начните творить.</p></div></div><button onClick={downloadProject} className="sidebar-export"><Archive size={16}/> Экспортировать проект <ArrowDownToLine size={15}/></button></div>
        <div className="resize-handle" onPointerDown={beginResize}/>
      </aside>}
      <main className="workspace">
        <div className="workspace-top"><div className="workspace-mode">{!sidebarVisible && <IconButton icon={PanelLeftOpen} title="Показать проводник" onClick={()=>setSidebarVisible(true)} className="show-sidebar"/>}<button className={`mode-tab ${mode==='code'?'active':''}`} onClick={()=>setMode('code')}><Code2 size={17}/> Код</button><button className={`mode-tab ${mode==='preview'?'active':''}`} onClick={setPreviewMode}><Globe2 size={17}/> Просмотр</button></div><div className="workspace-tools"><span className="workspace-hint">{mode==='code'?'РЕДАКТОР КОДА':'ПРЕДПРОСМОТР САЙТА'}</span><span className="tool-divider"/>{mode==='code' ? <><IconButton icon={Search} title="Поиск в коде (Ctrl+F)" onClick={()=>editorView.current && openSearchPanel(editorView.current)}/><IconButton icon={Save} title="Сохранить (Ctrl+S)" onClick={()=>{flushSave();notify('Проект сохранён')}}/></> : <><IconButton icon={RefreshCw} title="Обновить предпросмотр" onClick={reloadPreview}/><IconButton icon={fullscreen?Minimize2:Maximize2} title="На весь экран" onClick={toggleFullscreen}/></>}</div></div>
        {mode==='code' ? <><div className="tabs-bar">{tabsPresent.length ? tabsPresent.map(node=><div key={node.id} className={`file-tab ${activeId===node.id?'active':''}`} onClick={()=>setActiveId(node.id)}><KindIcon node={node} size={15}/><span>{node.name}</span><button title="Закрыть вкладку" onClick={e=>{e.stopPropagation();const remaining=tabs.filter(id=>id!==node.id);setTabs(remaining);if(activeId===node.id)setActiveId(remaining[remaining.length-1]||null)}}><X size={13}/></button></div>) : <div className="tabs-placeholder">Нет открытых файлов</div>}</div>
          <div className="editor-content">{active ? (fileType(active.name)==='text' ? <CodeEditor key={active.id+':'+active.name} node={active} states={editorStates} editorRef={editorView} onChange={(id,content)=>changeProject(p=>({...p,nodes:p.nodes.map(n=>n.id===id?{...n,content}:n)}))} onSave={flushSave}/> : <MediaViewer key={active.id} node={active}/>) : <div className="editor-empty"><div className="empty-symbol"><Code2 size={34}/></div><h2>Ваше пространство для идей</h2><p>Выберите файл в проводнике или создайте новый, чтобы начать работу.</p><div className="empty-actions"><button onClick={()=>openDialog('file')}><FilePlus2 size={16}/> Новый файл</button><button onClick={()=>chooseImport('files')}><Upload size={16}/> Импорт файлов</button></div><div className="shortcut-list"><span><kbd>Ctrl</kbd> + <kbd>S</kbd> сохранить</span><span><kbd>Ctrl</kbd> + <kbd>F</kbd> поиск в коде</span></div></div>}</div></> :
          <div className="preview-wrapper" ref={previewRef}><div className="browser-bar"><div className="browser-controls"><span/><span/><span/></div><div className="browser-address"><Globe2 size={14}/><span>{currentPage ? `${project.name}/${pathOf(currentPage,nodes)}` : 'Нет страницы для просмотра'}</span></div><IconButton icon={RefreshCw} title="Обновить" onClick={reloadPreview}/></div><div className="frame-area">{currentPage && frame?.pageId===currentPage.id ? <iframe key={frame.key} ref={frameRef} title="Предпросмотр сайта" sandbox="allow-scripts" srcDoc={frame.html} allow="fullscreen"/> : <div className="no-preview"><div className="no-preview-icon"><Globe2 size={36}/></div><h2>Пока нечего показывать</h2><p>Создайте файл <code>index.html</code>, и ваш сайт появится здесь.</p><button className="primary-button" onClick={()=>openDialog('file')}><FilePlus2 size={16}/> Создать HTML-файл</button></div>}</div></div>}
        <div className="status-bar"><div className="status-left"><span className="status-brand"><Code2 size={14}/></span><span>{mode==='code' ? activePath || 'Нет открытого файла' : currentPage ? pathOf(currentPage,nodes) : 'Предпросмотр'}</span></div><div className="status-right"><span className="status-online"><span/> Локально</span><span>{mode==='code' && active ? `${extension(active.name).toUpperCase()} · ${fileType(active.name)==='text'?'UTF-8':formatSize(sizeOf(active))}` : `${fileCount} файлов`}</span><span className="status-version">WebStudio 1.0</span></div></div>
      </main>
    </div>}
    {menu && <div className="context-menu" style={{left:menu.x,top:menu.y}} onPointerDown={e=>e.stopPropagation()}>{menu.kind==='import' ? <><div className="menu-heading">ИМПОРТ</div><button onClick={()=>chooseImport('files')}><FilePlus2 size={16}/> Файлы с компьютера</button><button onClick={()=>chooseImport('folder')}><FolderOpen size={16}/> Целую папку</button><button onClick={()=>chooseImport('zip')}><Archive size={16}/> ZIP-архив</button></> : <><div className="menu-heading">{menu.node.name}</div>{menu.node.kind==='folder' ? <><button onClick={()=>openDialog('file',menu.node)}><FilePlus2 size={16}/> Создать файл здесь</button><button onClick={()=>openDialog('folder',menu.node)}><FolderPlus size={16}/> Создать папку здесь</button></> : <><button onClick={()=>{openFile(menu.node.id);setMenu(null)}}><FileCode2 size={16}/> Открыть</button><button onClick={()=>downloadFile(menu.node)}><Download size={16}/> Скачать файл</button></>}<div className="menu-separator"/><button onClick={()=>openDialog('rename',menu.node)}><Pencil size={16}/> Переименовать</button><button className="danger" onClick={()=>openDialog('delete',menu.node)}><Trash2 size={16}/> Удалить</button></>}</div>}
    {dialog && <div className="modal-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setDialog(null)}}><div className={`modal ${dialog.type==='projects'?'projects-modal':''}`} role="dialog" aria-modal="true"><div className="modal-header"><div className="modal-icon">{dialog.type==='projects'?<FolderOpen size={21}/>:dialog.type==='delete'?<Trash2 size={21}/>:dialog.type==='folder'?<FolderPlus size={21}/>:dialog.type==='file'?<FilePlus2 size={21}/>:<Code2 size={21}/>}</div><IconButton icon={X} title="Закрыть" onClick={()=>setDialog(null)}/></div>
      {dialog.type==='projects' ? <><h2>Ваши проекты</h2><p className="modal-description">Продолжите работу или откройте проект с компьютера.</p><div className="project-list">{savedProjects.length ? savedProjects.map(p=><div className="saved-project" key={p.id}><div className="saved-project-icon"><Code2 size={18}/></div><button className="saved-project-main" onClick={()=>activateProject(p)}><strong>{p.name}</strong><span>{p.nodes.filter(n=>n.kind==='file').length} файлов · изменён {new Date(p.updatedAt).toLocaleDateString('ru-RU')}</span></button>{project?.id===p.id && <span className="current-project">ОТКРЫТ</span>}<IconButton icon={Trash2} title="Удалить проект" onClick={()=>deleteSaved(p)}/></div>) : <div className="no-projects">Сохранённых проектов пока нет</div>}</div><div className="projects-actions"><button onClick={()=>openDialog('newProject')}><Plus size={16}/> Новый проект</button><button onClick={()=>chooseImport('zip',true)}><Archive size={16}/> Открыть ZIP</button><button onClick={()=>chooseImport('folder',true)}><FolderOpen size={16}/> Открыть папку</button><button onClick={()=>chooseImport('files',true)}><Upload size={16}/> Файлы</button></div></> : <form onSubmit={submitDialog}><h2>{({newProject:'Новый проект',file:'Новый файл',folder:'Новая папка',rename:'Переименовать',delete:'Удалить объект?'})[dialog.type]}</h2><p className="modal-description">{dialog.type==='delete'?`«${dialog.node.name}»${dialog.node.kind==='folder'?' и всё содержимое папки':''} будут удалены из проекта. Это действие нельзя отменить.`:dialog.type==='newProject'?'Создайте отдельное рабочее пространство для нового сайта. Текущий проект сохранится.':dialog.type==='rename'?'Введите новое имя файла или папки.':'Укажите имя '+(dialog.type==='file'?'файла, например index.html.':'папки для вашего проекта.')}</p>{dialog.type!=='delete' && <label className="modal-label">{dialog.type==='newProject'?'НАЗВАНИЕ ПРОЕКТА':'ИМЯ'}<input autoFocus value={dialogValue} onChange={e=>setDialogValue(e.target.value)} placeholder={dialog.type==='file'?'index.html':dialog.type==='folder'?'assets':'Мой проект'} onFocus={e=>e.target.select()}/></label>}<div className="modal-actions"><button type="button" className="cancel-button" onClick={()=>setDialog(null)}>Отмена</button><button type="submit" className={dialog.type==='delete'?'delete-button':'primary-button'}>{dialog.type==='delete'?'Удалить':dialog.type==='rename'?'Сохранить':'Создать'}</button></div></form>}
    </div></div>}
    {toast && <div className={`toast ${toast.kind}`}><span className="toast-icon">{toast.kind==='error'?<CircleHelp size={17}/>:<Check size={17}/>}</span>{toast.message}<button onClick={()=>setToast(null)} aria-label="Закрыть"><X size={14}/></button></div>}
  </div>;
}
