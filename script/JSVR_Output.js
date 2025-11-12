// === JSVR_Output.js (versione con analisi degli errori e suggerimenti) ===
(() => {
  const input = document.getElementById("CodeReader");
  const outputContainer = document.querySelector(".div2 .code");

  if (!input || !outputContainer) {
    console.error("JSVR_Output.js: elementi non trovati");
    return;
  }

  function escapeHTML(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function appendOutputLine(content, type = "log") {
    const safe = escapeHTML(content || "");
    const spanClass =
      type === "error"
        ? "error"
        : type === "warn"
        ? "warn"
        : type === "info"
        ? "info"
        : type === "suggestion"
        ? "suggestion"
        : "";

    const lineHTML = `<div class="line"><span class="${spanClass}">${safe}</span></div>`;
    outputContainer.insertAdjacentHTML("beforeend", lineHTML);
    outputContainer.scrollTop = outputContainer.scrollHeight;
  }

  function clearOutput() {
    outputContainer.innerHTML = "";
  }

  // PROVA A ESTRARRE riga:col dalla stack o dal messaggio (formati vari)
  function extractLineCol(errText) {
    if (!errText) return null;
    // Cerca pattern :<line>:<col> come ...:12:34
    const m = errText.match(/:(\d+):(\d+)\)?(?:\s|$)/);
    if (m) return { line: parseInt(m[1], 10), col: parseInt(m[2], 10) };
    // Alcuni stack hanno at <anonymous>:12:34
    const m2 = errText.match(/<anonymous>:(\d+):(\d+)/);
    if (m2) return { line: parseInt(m2[1], 10), col: parseInt(m2[2], 10) };
    return null;
  }

  // Funzione che riceve l'errore grezzo e restituisce suggerimento testuale
  function analyzeError(message, stackText) {
    const lower = (message || "").toLowerCase();
    const stack = stackText || "";
    const loc = extractLineCol(stack) || extractLineCol(message);
    const atLine = loc ? ` (riga ~${loc.line}${loc.col ? `, col ${loc.col}` : ""})` : "";

    // serie di check con regex per errori comuni
    // 1) missing ) after argument list
    if (/missing\s*\)\s*after\s*argument\s*list/i.test(message) ||
        /missing\)\s*after\s*argument\s*list/i.test(stack)) {
      return {
        title: "Parentesi mancante dopo una lista di argomenti",
        suggestion:
`Probabile causa: hai aperto una parentesi '(' per chiamare una funzione, ma manca una parentesi di chiusura ')' nella stessa riga o prima della fine dell'argomento.
Controlla righe con chiamate come: console.log(...), func(a, b, c)
Cosa fare: verifica parentesi e virgole nella chiamata. Se usi stringhe, controlla che non interrompano la parentesi.
Suggerimento${atLine}: assicurati che tutte le parentesi siano bilanciate e che le stringhe siano chiuse.`
      };
    }

    // 2) Unexpected identifier (spesso manca una virgola o uso errato)
    if (/unexpected\s*identifier/i.test(message) || /unexpected\s*token\s*identifier/i.test(message)) {
      return {
        title: "Identificatore inatteso",
        suggestion:
`Probabile causa: potrebbe mancare una virgola tra elementi, o stai usando una parola riservata come identificatore, o hai dimenticato un operatore.
Cose da controllare: 
 - Se sei in una lista (es. parametri o array), verifica le virgole.
 - Se stai concatenando stringhe, assicurati di usare + o template literals.
Suggerimento${atLine}: controlla la sintassi intorno all'identificatore indicato e verifica virgole/parole riservate.`
      };
    }

    // 3) Unexpected token (spesso carattere extra come , ) ; o backtick)
    if (/unexpected\s*token/i.test(message) || /unterminated string constant/i.test(message)) {
      return {
        title: "Token inatteso o stringa non terminata",
        suggestion:
`Probabile causa: carattere non valido nella posizione indicata, oppure stringa non chiusa (", ', \`).
Cose da controllare:
 - Cerca caratteri extra come ; , ) } ] o simboli non validi.
 - Verifica che tutte le stringhe siano chiuse (matching " o ' o \`).
Suggerimento${atLine}: controlla che la riga contenga solo token validi e che le stringhe/comments siano chiusi.`
      };
    }

    // 4) ReferenceError: x is not defined
    const refMatch = message.match(/referenceerror:\s*([^ ]+)\s*is not defined/i);
    if (refMatch) {
      const name = refMatch[1];
      return {
        title: `Variabile "${name}" non definita`,
        suggestion:
`Probabile causa: stai usando ${name} senza dichiararla (let/const/var) o la variabile è definita in un scope diverso.
Cose da controllare:
 - Hai dimenticato una dichiarazione: aggiungi "let ${name} = ...;" oppure "const ${name} = ...;" prima dell'uso.
 - Se la variabile è globale in un altro file, assicurati che quel file venga caricato prima.
Suggerimento${atLine}: dichiara la variabile o verifica lo scope.`
      };
    }

    // 5) TypeError: ... is not a function
    if (/is not a function/i.test(message)) {
      return {
        title: "TypeError: valore non è una funzione",
        suggestion:
`Probabile causa: stai chiamando come funzione qualcosa che non lo è (es. una stringa, undefined o risultato di una espressione).
Cose da controllare:
 - Verifica il valore prima di chiamarlo (console.log(typeof x)).
 - Controlla che non sovrascrivi una funzione con una variabile.
Suggerimento${atLine}: isola il valore e controllane il tipo prima della chiamata.`
      };
    }

    // 6) SyntaxError: Unexpected end of input (spesso parentesi/brace/string non chiuse)
    if (/unexpected end of input/i.test(message) || /unexpected end/i.test(message)) {
      return {
        title: "Fine del file inattesa (mancano chiusure)",
        suggestion:
`Probabile causa: manca una parentesi, graffa o una stringa non chiusa alla fine del file.
Cose da controllare:
 - Conta parentesi (), {}, [] e verifica che siano bilanciate.
 - Verifica commenti /* ... */ non chiusi e stringhe non terminate.
Suggerimento${atLine}: assicurati di chiudere tutte le aperture.`
      };
    }

    // 7) default fallback: tenta dare indicazioni generiche secondo parole chiave
    if (/syntaxerror/i.test(message) || /syntax error/i.test(message)) {
      return {
        title: "Errore di sintassi",
        suggestion:
`L'interpretore ha trovato un errore di sintassi. Controlla caratteri speciali, parentesi e stringhe nella posizione indicata.
Suggerimento${atLine}: esamina la riga indicata dallo stack e verifica parentesi/virgole/stringhe non chiuse.`
      };
    }

    // fallback molto generico
    return {
      title: "Errore rilevato",
      suggestion:
`Messaggio: ${message || stack || "Errore non identificato"}${atLine}
Suggerimento: prova a controllare la riga indicata nello stack.`
    };
  }

  // ricezione dei messaggi dall'iframe
  window.addEventListener("message", (ev) => {
    const msg = ev.data;
    if (!msg || typeof msg !== "object") return;

    switch (msg.type) {
      case "clear":
        clearOutput();
        break;

      case "log":
      case "info":
      case "warn":
        appendOutputLine(msg.data, msg.type);
        break;

      case "error": {
        // Mostra l'errore così com'è
        appendOutputLine(msg.data, "error");

        // Se lo stack è fornito (msg.data potrebbe essere stack o messaggio)
        const stackText = msg.stack || msg.data || "";
        const analysis = analyzeError(String(msg.data || ""), String(stackText));
        // Mostra titolo suggerimento in evidenza
        appendOutputLine(`${analysis.title}`, "suggestion");
        // Mostra suggerimento dettagliato (più righe possibili)
        analysis.suggestion.split("\n").forEach(line => {
          if (line.trim() === "") return;
          appendOutputLine(line.trim(), "suggestion");
        });
        break;
      }

      default:
        // ignora
        break;
    }
  });

  // Esegue il codice in iframe (base64-safe)
  function runCodeInSandbox(code) {
    clearOutput();

    const oldFrame = document.getElementById("sandbox-frame");
    if (oldFrame) oldFrame.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "sandbox-frame";
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const base64Code = btoa(unescape(encodeURIComponent(code)));

    const src = `
      <!DOCTYPE html>
      <html><head><meta charset="UTF-8"></head>
      <body>
      <script>
        (function() {
          const send = (type, data, stack) => parent.postMessage({ type, data, stack }, "*");
          const serialize = (args) =>
            Array.from(args)
              .map(a => {
                try {
                  if (typeof a === "object" && a !== null) return JSON.stringify(a);
                } catch {}
                return String(a);
              })
              .join(" ");

          console.log = (...args) => send("log", serialize(args));
          console.info = (...args) => send("info", serialize(args));
          console.warn = (...args) => send("warn", serialize(args));
          console.error = (...args) => send("error", serialize(args));
          console.clear = () => send("clear", "");

          window.onerror = function(msg, url, line, col, err) {
            const stack = (err && err.stack) ? err.stack : (msg + " at " + (line||"?") + ":" + (col||"?"));
            send("error", msg, stack);
          };

          try {
            const decoded = decodeURIComponent(escape(atob("${base64Code}")));
            new Function(decoded)();
          } catch (err) {
            const stack = err && err.stack ? err.stack : String(err);
            send("error", String(err), stack);
          }
        })();
      </script>
      </body></html>
    `;

    iframe.srcdoc = src;
  }

  // Quando carichi un file, leggilo ed eseguilo immediatamente
  input.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const code = ev.target.result;
      appendOutputLine("▶ Esecuzione codice in corso...", "info");
      runCodeInSandbox(code);
    };
    reader.readAsText(file);
  });

  // Accent styling per suggerimenti
  const style = document.createElement("style");
  style.textContent = `
    .div2 .line .error {
      color: #ff6b6b;
      font-weight: 600;
    }
    .div2 .line .warn {
      color: #ffd43b;
    }
    .div2 .line .info {
      color: #6ec1ff;
    }
    .div2 .line .suggestion {
      display: inline-block;
      background: rgba(100, 120, 255, 0.05);
      border-left: 3px solid rgba(100, 120, 255, 0.18);
      color: #bcd0ff;
      padding: 4px 8px;
      border-radius: 6px;
      margin-top: 4px;
    }
  `;
  document.head.appendChild(style);
})();
