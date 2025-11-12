const input = document.getElementById("CodeReader");
const codeContainer = document.querySelector(".code");

function escapeHTML(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function tokenizeAndHighlight(code) {
  const tokens = [];
  let i = 0;
  
  while (i < code.length) {
    let matched = false;
    
    // Newline character (handle first)
    if (code[i] === '\n') {
      tokens.push({ type: 'newline', value: '\n' });
      i++;
      continue;
    }
    
    // Whitespace (spaces and tabs) - keep as plain text
    if (/[ \t]/.test(code[i])) {
      let j = i;
      while (j < code.length && /[ \t]/.test(code[j])) {
        j++;
      }
      tokens.push({ type: 'text', value: code.substring(i, j) });
      i = j;
      continue;
    }
    
    // Multi-line comment
    if (code.substr(i, 2) === '/*') {
      const end = code.indexOf('*/', i + 2);
      if (end !== -1) {
        tokens.push({ type: 'comment', value: code.substring(i, end + 2) });
        i = end + 2;
        matched = true;
      }
    }
    
    // Single-line comment (don't include the newline)
    if (!matched && code.substr(i, 2) === '//') {
      let j = i + 2;
      while (j < code.length && code[j] !== '\n') {
        j++;
      }
      tokens.push({ type: 'comment', value: code.substring(i, j) });
      i = j;
      matched = true;
    }
    
    // Strings (single, double, backtick)
    if (!matched && (code[i] === '"' || code[i] === "'" || code[i] === '`')) {
      const quote = code[i];
      let j = i + 1;
      while (j < code.length && code[j] !== '\n') {
        if (code[j] === quote && code[j - 1] !== '\\') {
          break;
        }
        j++;
      }
      tokens.push({ type: 'variable', value: code.substring(i, j + 1) });
      i = j + 1;
      matched = true;
    }
    
    // Keywords and identifiers
    if (!matched && /[A-Za-z_$]/.test(code[i])) {
      let j = i;
      while (j < code.length && /[A-Za-z0-9_$]/.test(code[j])) {
        j++;
      }
      const word = code.substring(i, j);
      const keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 
                       'for', 'while', 'class', 'new', 'import', 'export', 'from',
                       'await', 'async', 'try', 'catch', 'throw', 'switch', 'case',
                       'break', 'default', 'continue', 'typeof', 'instanceof'];
      
      if (keywords.includes(word)) {
        tokens.push({ type: 'commands', value: word });
      } else {
        tokens.push({ type: 'variable', value: word });
      }
      i = j;
      matched = true;
    }
    
    // Numbers
    if (!matched && /\d/.test(code[i])) {
      let j = i;
      while (j < code.length && /[\d.]/.test(code[j])) {
        j++;
      }
      tokens.push({ type: 'numbers', value: code.substring(i, j) });
      i = j;
      matched = true;
    }
    
    // Brackets
    if (!matched && /[()[\]{}]/.test(code[i])) {
      tokens.push({ type: 'brackets', value: code[i] });
      i++;
      matched = true;
    }
    
    // Operators
    if (!matched && /[=!+\-*/%<>^|&~:;.,?]/.test(code[i])) {
      let j = i;
      while (j < code.length && /[=!+\-*/%<>^|&~:;.,?]/.test(code[j])) {
        j++;
      }
      tokens.push({ type: 'operator', value: code.substring(i, j) });
      i = j;
      matched = true;
    }
    
    // Everything else
    if (!matched) {
      tokens.push({ type: 'text', value: code[i] });
      i++;
    }
  }
  
  return tokens;
}

function tokensToHTML(tokens) {
  let html = '';
  
  for (const token of tokens) {
    if (token.type === 'newline') {
      html += '\n';
    } else {
      const escaped = escapeHTML(token.value);
      if (token.type === 'text' && /^\s+$/.test(token.value)) {
        html += escaped;
      } else if (token.type === 'text') {
        html += escaped;
      } else {
        html += `<span class="${token.type}">${escaped}</span>`;
      }
    }
  }
  
  return html;
}

input.addEventListener("change", () => {
  const file = input.files && input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    
    // Tokenize the entire code
    const tokens = tokenizeAndHighlight(text);
    const highlighted = tokensToHTML(tokens);
    
    // Split into lines - CSS will handle line numbers via counter
    const html = highlighted
      .split(/\r?\n/)
      .map((line) => {
        const content = line === "" ? "&nbsp;" : line;
        return `<div class="line"><span>${content}</span></div>`;
      })
      .join("");

    // Update the display
    codeContainer.innerHTML = html;
  };

  reader.readAsText(file);
});