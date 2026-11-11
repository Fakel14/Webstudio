import {pathOf, mimeFor} from './project.js';

// The iframe has an opaque sandboxed origin. Project resources are materialized as
// revocable blob URLs, while references retain the directory semantics of the ZIP.
export function resolveProjectPath(reference, basePath) {
  if (!reference || /^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(reference)) return null;
  try {
    const url = new URL(reference, `https://webstudio.invalid/${basePath}`);
    if (url.hostname !== 'webstudio.invalid') return null;
    return decodeURIComponent(url.pathname.slice(1));
  } catch { return null; }
}
export function buildPreview(project, page) {
  const files = new Map(project.nodes.filter(n => n.kind === 'file').map(n => [pathOf(n, project.nodes), n]));
  const urls = new Map(); const objectUrls = []; const building = new Set();
  const makeUrl = (path) => {
    if (urls.has(path)) return urls.get(path);
    const node = files.get(path); if (!node || building.has(path)) return null;
    building.add(path);
    let blob;
    if (node.content instanceof Blob) blob = node.content;
    else {
      const text = /\.css$/i.test(path) ? rewriteCss(node.content || '', path) : (node.content || '');
      blob = new Blob([text], {type: node.mime || mimeFor(path)});
    }
    const url = URL.createObjectURL(blob); objectUrls.push(url); urls.set(path,url); building.delete(path); return url;
  };
  const rewrite = (ref, base) => { const path = resolveProjectPath(ref,base); return path ? (makeUrl(path) || ref) : ref; };
  function rewriteCss(css, base) {
    return css.replace(/url\(\s*(?:(['"])(.*?)\1|([^)]*?))\s*\)/gi, (match, quote, quoted, bare) => `url("${rewrite((quoted ?? bare).trim(),base)}")`)
      .replace(/@import\s+(['"])([^'"]+)\1/gi, (match, quote, ref) => `@import "${rewrite(ref,base)}"`);
  }
  const doc = new DOMParser().parseFromString(String(files.get(page)?.content || ''), 'text/html');
  doc.querySelectorAll('[src], [href], [poster], [data]').forEach(el => {
    for (const attr of ['src','href','poster','data']) {
      if (!el.hasAttribute(attr)) continue;
      // Keep HTML links as paths; a bridge handles navigation without granting the frame same-origin access.
      if (el.tagName === 'A' && attr === 'href') continue;
      el.setAttribute(attr, rewrite(el.getAttribute(attr),page));
    }
  });
  doc.querySelectorAll('[srcset]').forEach(el => el.setAttribute('srcset', el.getAttribute('srcset').split(',').map(item => {
    const match = item.trim().match(/^(\S+)(.*)$/); return match ? rewrite(match[1],page) + match[2] : item;
  }).join(', ')));
  doc.querySelectorAll('[style]').forEach(el => el.setAttribute('style',rewriteCss(el.getAttribute('style'),page)));
  doc.querySelectorAll('style').forEach(el => { el.textContent = rewriteCss(el.textContent,page); });
  const bridge = doc.createElement('script');
  bridge.textContent = `document.addEventListener('click',function(event){var link=event.target.closest('a[href]');if(!link)return;var href=link.getAttribute('href');if(!href||href[0]==='#'||/^(https?:|mailto:|tel:|javascript:)/i.test(href)||href.startsWith('//'))return;event.preventDefault();parent.postMessage({type:'webstudio:navigate',href:href},'*')});`;
  (doc.head || doc.documentElement).append(bridge);
  const html = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  return {html, dispose: () => objectUrls.forEach(url => URL.revokeObjectURL(url))};
}
export function previewPage(project, selectedId) {
  const html = project.nodes.filter(n => n.kind === 'file' && /\.html?$/i.test(n.name));
  return (html.find(n => n.id === selectedId) || html.find(n => pathOf(n,project.nodes) === 'index.html') || html[0]) || null;
}
