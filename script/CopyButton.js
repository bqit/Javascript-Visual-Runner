document.addEventListener("DOMContentLoaded", () => {
  // mappa id pulsante -> selettore del contenuto da copiare
  const mapping = {
    copycode: ".div1 .code",
    copyoutput: ".div2 .code"
  };

  // funzione di copia con fallback
  async function copyToClipboard(text) {
    if (!text) return false;
    // prova Clipboard API
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {
      // fallthrough al fallback
    }

    // fallback: textarea + execCommand
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      // posizionamento fuori schermo
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand && document.execCommand("copy");
      document.body.removeChild(ta);
      return !!ok;
    } catch (e) {
      return false;
    }
  }

  // crea e mostra tooltip (appende al body per evitare clipping)
  function showTooltip(button, message = "Copied!", duration = 600) {
    const tip = document.createElement("div");
    if(message == "Copied!") tip.className = "jsvr-tooltip";
    else tip.className = "jsvr-tooltip-failed";
    tip.textContent = message;
    document.body.appendChild(tip);

    // posizione: centro sopra il pulsante
    const rect = button.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect(); // potrebbe essere 0x0 finché non è in DOM
    // calcola posizione dopo forcing reflow
    const left = rect.left + rect.width / 2 - tipRect.width / 2;
    const top = rect.top - 8 - tipRect.height; // 8px spazio
    tip.style.left = `${Math.max(8, left)}px`;
    tip.style.top = `${Math.max(8, top)}px`;

    // aggiungi classe per animare opacità/trasform (CSS sotto)
    requestAnimationFrame(() => tip.classList.add("show"));

    // rimuovi dopo duration
    setTimeout(() => {
      tip.classList.remove("show");
      // pulizia dopo transizione (300ms)
      setTimeout(() => {
        if (tip.parentNode) tip.parentNode.removeChild(tip);
      }, 300);
    }, duration);
  }

  // setup pulsanti
  Object.entries(mapping).forEach(([buttonId, contentSelector]) => {
    const button = document.getElementById(buttonId);
    if (!button) return;

    button.addEventListener("click", async (ev) => {
      // prendi contenuto del contenitore; innerText preserva formattazione leggibile
      const container = document.querySelector(contentSelector);
      const text = container ? container.innerText.trim() : "";

      const success = await copyToClipboard(text);
      if (success) {
        showTooltip(button, "Copied!");
      } else {
        showTooltip(button, "Copy failed");
      }
    });
  });
});
