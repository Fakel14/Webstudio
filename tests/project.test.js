import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {JSDOM} from 'jsdom';
import {indexedDB} from 'fake-indexeddb';
import {
  addEntries, availableName, blankProject, canMove, clearProject, demoProject, entriesFromZip,
  exportZip, fileType, listProjects, loadProject, pathOf, removeBranch, saveProject, uid
} from '../src/project.js';
import {buildPreview, resolveProjectPath} from '../src/preview.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>',{url:'https://webstudio.test'});
globalThis.indexedDB = indexedDB; globalThis.localStorage=dom.window.localStorage;
globalThis.DOMParser=dom.window.DOMParser;
const blobs=new Map(); let blobIndex=0;
URL.createObjectURL = blob => {const url=`blob:https://webstudio.test/${++blobIndex}`;blobs.set(url,blob);return url};
URL.revokeObjectURL = url => blobs.delete(url);

test('create, rename, move and delete nested project nodes', () => {
  let p=blankProject('Test');
  p=addEntries(p,[{path:'images/logo.png',data:new Blob([new Uint8Array([137,80,78,71])],{type:'image/png'}),mime:'image/png'}, {path:'audio/music.mp3',data:new Blob(['mp3'],{type:'audio/mpeg'}),mime:'audio/mpeg'}, {path:'index.html',data:'<h1>Hello</h1>',mime:'text/html'}]);
  assert.equal(p.nodes.length,5);
  const image=p.nodes.find(n=>n.name==='logo.png');
  const images=p.nodes.find(n=>n.name==='images');
  const audio=p.nodes.find(n=>n.name==='audio');
  assert.equal(pathOf(image,p.nodes),'images/logo.png');
  assert.equal(fileType(image.name),'image');
  assert.equal(fileType('music.mp3'),'audio');
  assert.equal(availableName(p.nodes,images.id,'logo.png'),'logo (2).png');
  assert.equal(canMove(p.nodes,images.id,image.id),false);
  assert.equal(canMove(p.nodes,image.id,audio.id),true);
  image.parentId=audio.id;image.name='renamed.png';
  assert.equal(pathOf(image,p.nodes),'audio/renamed.png');
  const removed=removeBranch(p.nodes,audio.id);
  assert.equal(removed.nodes.length,2);
  assert(!removed.nodes.some(n=>n.name==='renamed.png'));
});

test('ZIP roundtrip keeps folders and exact PNG/MP3 bytes without nested root', async () => {
  const png=new Uint8Array([137,80,78,71,13,10,26,10,0,1,2,3]);
  const mp3=new Uint8Array([73,68,51,3,0,4,20,30]);
  let p=blankProject('my-site');
  p=addEntries(p,[{path:'assets/images/logo.png',data:new Blob([png],{type:'image/png'}),mime:'image/png'}, {path:'assets/audio/music.mp3',data:new Blob([mp3],{type:'audio/mpeg'}),mime:'audio/mpeg'}, {path:'assets/empty',folder:true}, {path:'index.html',data:'<img src="assets/images/logo.png">',mime:'text/html'}]);
  const zip=await exportZip(p);
  const entries=await entriesFromZip(zip);
  const restored=addEntries(blankProject('imported'),entries,true);
  assert.equal(restored.name,'my-site');
  assert.deepEqual(restored.nodes.filter(n=>n.kind==='file').map(n=>pathOf(n,restored.nodes)).sort(),['assets/audio/music.mp3','assets/images/logo.png','index.html']);
  assert(restored.nodes.some(n=>pathOf(n,restored.nodes)==='assets/empty' && n.kind==='folder'));
  assert.deepEqual(new Uint8Array(await restored.nodes.find(n=>n.name==='logo.png').content.arrayBuffer()),png);
  assert.deepEqual(new Uint8Array(await restored.nodes.find(n=>n.name==='music.mp3').content.arrayBuffer()),mp3);
  assert.equal(restored.nodes.find(n=>n.name==='music.mp3').content.type,'audio/mpeg');
});

test('ZIP blocks traversal entries',async () => {
  const zip=new JSZip();zip.file('../escape.txt','bad');zip.file('safe/index.html','good');
  const entries=await entriesFromZip(await zip.generateAsync({type:'blob'}));
  assert.deepEqual(entries.filter(e=>!e.folder).map(e=>e.path),['safe/index.html']);
});

test('preview resolves relative paths for HTML, CSS, PNG, MP3, JavaScript',async () => {
  let p=blankProject('preview');
  p=addEntries(p,[
    {path:'pages/index.html',data:'<html><head><link rel="stylesheet" href="../styles/site.css"></head><body style="background-image: url(../images/logo.png)"><img src="../images/logo.png"><audio controls src="../audio/music.mp3"></audio><script src="../script.js"></script></body></html>',mime:'text/html'},
    {path:'styles/site.css',data:'body { background: url("../images/logo.png"); }',mime:'text/css'},
    {path:'script.js',data:'document.body.dataset.ready="yes"',mime:'text/javascript'},
    {path:'images/logo.png',data:new Blob(['png'],{type:'image/png'}),mime:'image/png'},
    {path:'audio/music.mp3',data:new Blob(['mp3'],{type:'audio/mpeg'}),mime:'audio/mpeg'}
  ]);
  assert.equal(resolveProjectPath('../images/logo.png','pages/index.html'),'images/logo.png');
  const preview=buildPreview(p,'pages/index.html');
  const doc=new DOMParser().parseFromString(preview.html,'text/html');
  assert.match(doc.querySelector('img').getAttribute('src'),/^blob:/);
  assert.match(doc.querySelector('audio').getAttribute('src'),/^blob:/);
  assert.match(doc.querySelector('script[src]').getAttribute('src'),/^blob:/);
  const css=await blobs.get(doc.querySelector('link').href).text();
  assert.match(css,/url\("blob:/);
  assert.match(doc.body.getAttribute('style'),/blob:/);
  assert.equal(doc.querySelector('script:not([src])')?.textContent.includes('webstudio:navigate'),true);
  const count=blobs.size;assert(count>=4);preview.dispose();assert.equal(blobs.size,0);
});

test('IndexedDB saves and loads several projects with binary content',async () => {
  const first=demoProject();let second=blankProject('Assets');
  second=addEntries(second,[{path:'logo.png',data:new Blob(['PNG'],{type:'image/png'}),mime:'image/png'}]);
  await saveProject(first);await saveProject(second);
  localStorage.setItem('webstudio-active',second.id);
  assert.equal((await loadProject()).name,'Assets');
  assert.equal((await listProjects()).length,2);
  assert.equal((await loadProject()).nodes[0].content.type,'image/png');
  await clearProject(first.id);await clearProject(second.id);
  assert.equal((await listProjects()).length,0);
});
