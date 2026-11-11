import React, {useEffect, useRef} from 'react';
import {EditorState} from '@codemirror/state';
import {EditorView, keymap} from '@codemirror/view';
import {basicSetup} from 'codemirror';
import {oneDark} from '@codemirror/theme-one-dark';
import {html} from '@codemirror/lang-html';
import {css} from '@codemirror/lang-css';
import {javascript} from '@codemirror/lang-javascript';
import {json} from '@codemirror/lang-json';
import {xml} from '@codemirror/lang-xml';
import {markdown} from '@codemirror/lang-markdown';
import {extension} from './project.js';

function language(name) {
  switch(extension(name)) {
    case 'html': case 'htm': return html();
    case 'css': case 'scss': return css();
    case 'js': case 'jsx': case 'mjs': case 'ts': case 'tsx': return javascript({typescript:['ts','tsx'].includes(extension(name)),jsx:['jsx','tsx'].includes(extension(name))});
    case 'json': return json();
    case 'svg': case 'xml': return xml();
    case 'md': case 'markdown': return markdown();
    default: return [];
  }
}
const editorTheme = EditorView.theme({
  '&': {height:'100%', backgroundColor:'#0e1520', color:'#cbd6e7', fontSize:'13px'},
  '.cm-scroller': {fontFamily:'"JetBrains Mono", "SFMono-Regular", Consolas, monospace', lineHeight:'1.8', overflow:'auto'},
  '.cm-content': {padding:'20px 0 80px', caretColor:'#59ddd1'},
  '.cm-line': {padding:'0 20px'},
  '.cm-gutters': {backgroundColor:'#0e1520', border:'none', color:'#536174', paddingLeft:'13px', paddingRight:'8px'},
  '.cm-activeLine, .cm-activeLineGutter': {backgroundColor:'#ffffff07'},
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {backgroundColor:'#35bfba44 !important'},
  '.cm-cursor': {borderLeftColor:'#46d9cc'},
  '.cm-searchMatch': {backgroundColor:'#d2ab4740'},
  '.cm-searchMatch.cm-searchMatch-selected': {backgroundColor:'#54c5bf66'},
  '.cm-panels': {backgroundColor:'#172331', color:'#e4edf8', borderBottom:'1px solid #304050'},
  '.cm-panel input': {background:'#0b1420', color:'#e4edf8', border:'1px solid #344355', borderRadius:'5px', padding:'4px 8px'},
  '.cm-panel button': {background:'#27384b', color:'#e4edf8', border:'0', borderRadius:'5px', padding:'5px 9px'}
}, {dark:true});

export default function CodeEditor({node, states, onChange, onSave, editorRef}) {
  const mount = useRef(null); const liveView = useRef(null);
  const callbacks = useRef({onChange,onSave}); callbacks.current = {onChange,onSave};
  useEffect(() => {
    let state = states.current.get(node.id + ':' + node.name);
    if (!state) {
      state = EditorState.create({doc:String(node.content || ''), extensions:[basicSetup, oneDark, editorTheme, language(node.name),
        EditorState.tabSize.of(2),
        keymap.of([{key:'Mod-s', run:() => {callbacks.current.onSave(); return true;}}]),
        EditorView.updateListener.of(update => { if(update.docChanged) callbacks.current.onChange(node.id, update.state.doc.toString()); })
      ]});
    }
    const view = new EditorView({state, parent:mount.current}); editorRef.current = view; liveView.current = view;
    return () => { states.current.set(node.id + ':' + node.name,view.state); if(editorRef.current === view) editorRef.current = null; liveView.current = null; view.destroy(); };
  }, [node.id, node.name, states, editorRef]);
  useEffect(() => { const view = liveView.current; if(view && view.state.doc.toString() !== String(node.content ?? '')) view.dispatch({changes:{from:0,to:view.state.doc.length,insert:String(node.content ?? '')}}); }, [node.content]);
  return <div className="editor-mount" ref={mount} />;
}
