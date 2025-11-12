(() => {
  const DEBOUNCE_MS = 420;

  const escapeHTML = s =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  function renderLines(editor, text) {
    const lines = String(text).split('\n');
    if (lines.length === 0) lines.push('');
    
    const html = lines.map(line => {
      const content = line === '' ? '&#160;' : escapeHTML(line);
      return `<div class="line"><span>${content}</span></div>`;
    }).join('');
    editor.innerHTML = html;
  }

  function getEditorText(editor) {
    const spans = Array.from(editor.querySelectorAll('.line > span'));
    if (spans.length === 0) return '';
    return spans.map(s => {
      const text = s.textContent || '';
      return text === '\u00A0' ? '' : text;
    }).join('\n');
  }

  function getSelectionOffsets(editor) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return { start: 0, end: 0 };
    
    try {
      const range = sel.getRangeAt(0);
      let start = 0;
      let end = 0;
      
      const lines = Array.from(editor.querySelectorAll('.line'));
      let found = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const span = line.querySelector('span');
        if (!span) continue;
        
        const lineText = span.textContent === '\u00A0' ? '' : span.textContent;
        
        if (!found && (line.contains(range.startContainer) || span.contains(range.startContainer) || span === range.startContainer)) {
          if (range.startContainer.nodeType === Node.TEXT_NODE) {
            start += range.startOffset;
          }
          found = true;
        } else if (!found) {
          start += lineText.length + 1;
        }
        
        if (line.contains(range.endContainer) || span.contains(range.endContainer) || span === range.endContainer) {
          if (range.endContainer.nodeType === Node.TEXT_NODE) {
            end = start + (range.endContainer === range.startContainer ? range.endOffset - range.startOffset : range.endOffset);
          } else {
            end = start;
          }
          break;
        } else if (found) {
          end += lineText.length + 1;
        }
      }
      
      return { start: Math.max(0, start), end: Math.max(0, end) };
    } catch (e) {
      return { start: 0, end: 0 };
    }
  }

  function setCaretAt(editor, charIndex) {
    const lines = Array.from(editor.querySelectorAll('.line > span'));
    if (lines.length === 0) return;
    
    let currentPos = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const span = lines[i];
      const lineText = span.textContent === '\u00A0' ? '' : span.textContent;
      const lineLength = lineText.length;
      
      if (currentPos + lineLength >= charIndex || i === lines.length - 1) {
        const offset = Math.min(Math.max(0, charIndex - currentPos), lineLength);
        const textNode = span.firstChild;
        
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          try {
            const range = document.createRange();
            range.setStart(textNode, offset);
            range.collapse(true);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);

            span.parentElement.scrollIntoView({ block: 'nearest', behavior: 'auto' });
          } catch (e) {
            console.error('Error setting caret:', e);
          }
        }
        return;
      }
      currentPos += lineLength + 1; 
    }
  }

  function clearOutput() {
    if (window.postMessage) window.postMessage({ type: 'clear' }, '*');
  }

  function runCodeNow(code) {
    if (!code) return;
    clearOutput();
    if (window.JSVR && typeof window.JSVR.runCodeInSandbox === 'function') {
      window.JSVR.runCodeInSandbox(code);
      return;
    }
    try {
      const old = document.getElementById('sandbox-frame-editor');
      if (old) old.remove();
      const iframe = document.createElement('iframe');
      iframe.id = 'sandbox-frame-editor';
      iframe.setAttribute('sandbox', 'allow-scripts');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const base64Code = btoa(unescape(encodeURIComponent(code)));
      const src = `<!doctype html><html><head><meta charset="utf-8"></head><body><script>
        (function(){
          const send=(type,data,stack)=>parent.postMessage({type,data,stack},"*");
          const serialize=(args)=>Array.from(args).map(a=>{try{if(typeof a==='object'&&a!==null)return JSON.stringify(a)}catch{}return String(a)}).join(' ');
          console.log=(...args)=>send('log',serialize(args));
          console.info=(...args)=>send('info',serialize(args));
          console.warn=(...args)=>send('warn',serialize(args));
          console.error=(...args)=>send('error',serialize(args));
          console.clear=()=>send('clear','');
          window.onerror=function(msg,url,line,col,err){const stack=(err&&err.stack)?err.stack:(msg+' at '+(line||'?')+':'+(col||'?'));send('error',msg,stack);};
          try{
            const decoded=decodeURIComponent(escape(atob("${base64Code}")));
            new Function(decoded)();
          }catch(err){
            const stack=err&&err.stack?err.stack:String(err);
            send('error',String(err),stack);
          }
        })();
      <\/script></body></html>`;
      iframe.srcdoc = src;
    } catch (err) {
      console.error('Live-run fallback failed', err);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const editor = document.querySelector('.div1 .code');
    const fileInput = document.getElementById('CodeReader');
    if (!editor) return;

    editor.setAttribute('contenteditable', 'true');
    editor.setAttribute('spellcheck', 'false');
    editor.classList.add('jsvr-editable');
    const initialText = editor.innerText.trim() || '';
    renderLines(editor, initialText);

    setTimeout(() => runCodeNow(getEditorText(editor)), 120);
    const runDebounced = debounce(() => runCodeNow(getEditorText(editor)), DEBOUNCE_MS);

    editor.addEventListener('beforeinput', (ev) => {
      const it = ev.inputType || '';
      ev.preventDefault();

      const { start, end } = getSelectionOffsets(editor);
      const txt = getEditorText(editor);

      if (it === 'insertParagraph' || it === 'insertLineBreak') {
        const newText = txt.slice(0, start) + '\n' + txt.slice(end);
        renderLines(editor, newText);
        setTimeout(() => setCaretAt(editor, start + 1), 0);
        runDebounced();
      }
      else if (it === 'deleteContentBackward') {
        if (start !== end) {
          const newText = txt.slice(0, start) + txt.slice(end);
          renderLines(editor, newText === '' ? '' : newText);
          setTimeout(() => setCaretAt(editor, start), 0);
          runDebounced();
        } else if (start > 0) {
          const newText = txt.slice(0, start - 1) + txt.slice(start);
          renderLines(editor, newText === '' ? '' : newText);
          setTimeout(() => setCaretAt(editor, start - 1), 0);
          runDebounced();
        }
      }
      else if (it === 'deleteContentForward') {
        if (start !== end) {
          const newText = txt.slice(0, start) + txt.slice(end);
          renderLines(editor, newText === '' ? '' : newText);
          setTimeout(() => setCaretAt(editor, start), 0);
          runDebounced();
        } else if (start < txt.length) {
          const newText = txt.slice(0, start) + txt.slice(start + 1);
          renderLines(editor, newText === '' ? '' : newText);
          setTimeout(() => setCaretAt(editor, start), 0);
          runDebounced();
        }
      }
      else if (it === 'insertText') {
        const data = ev.data || '';
        const newText = txt.slice(0, start) + data + txt.slice(end);
        renderLines(editor, newText);
        setTimeout(() => setCaretAt(editor, start + data.length), 0);
        runDebounced();
      }
      else if (it === 'insertFromPaste') {
        
      }
      else if (it === 'deleteByCut' || it === 'deleteByDrag') {
        const newText = txt.slice(0, start) + txt.slice(end);
        renderLines(editor, newText === '' ? '' : newText);
        setTimeout(() => setCaretAt(editor, start), 0);
        runDebounced();
      }
    });

    editor.addEventListener('paste', (ev) => {
      ev.preventDefault();
      
      const text = (ev.clipboardData || window.clipboardData).getData('text/plain') || '';
      const { start, end } = getSelectionOffsets(editor);
      const txt = getEditorText(editor);
      
      const newText = txt.slice(0, start) + text + txt.slice(end);
      renderLines(editor, newText);
      setTimeout(() => setCaretAt(editor, start + text.length), 0);
      runDebounced();
    });

    editor.addEventListener('keydown', (ev) => {
      if (ev.key === 'Tab') {
        ev.preventDefault();
        
        const { start, end } = getSelectionOffsets(editor);
        const txt = getEditorText(editor);
        const newText = txt.slice(0, start) + '  ' + txt.slice(end);
        renderLines(editor, newText);
        setTimeout(() => setCaretAt(editor, start + 2), 0);
        runDebounced();
        return;
      }
      if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') {
        ev.preventDefault();
        runCodeNow(getEditorText(editor));
      }
    });

    const copyBtn = document.getElementById('copycode');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const text = getEditorText(editor);
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
          } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
          }
          copyBtn.dispatchEvent(new CustomEvent('jsvr-copied', { detail: { success: true } }));
        } catch {
          copyBtn.dispatchEvent(new CustomEvent('jsvr-copied', { detail: { success: false } }));
        }
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const fileText = String(ev.target.result || '');
          renderLines(editor, fileText);
          setTimeout(() => {
            setCaretAt(editor, fileText.length);
            runCodeNow(getEditorText(editor));
          }, 0);
        };
        reader.readAsText(f);
      });
    }
  });
})();