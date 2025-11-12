document.addEventListener("DOMContentLoaded", () => {
  const mapping = {
    copycode: ".div1 .code",
    copyoutput: ".div2 .code"
  };

  async function copyToClipboard(text) {
    if (!text) return false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {

    }

    try {
      const ta = document.createElement("textarea");
      ta.value = text;
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

  function showTooltip(button, message = "Copied!", duration = 600) {
    const tip = document.createElement("div");
    if(message == "Copied!") tip.className = "jsvr-tooltip";
    else tip.className = "jsvr-tooltip-failed";
    tip.textContent = message;
    document.body.appendChild(tip);

    const rect = button.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const left = rect.left + rect.width / 2 - tipRect.width / 2;
    const top = rect.top - 8 - tipRect.height; // 8px spazio
    tip.style.left = `${Math.max(8, left)}px`;
    tip.style.top = `${Math.max(8, top)}px`;

    requestAnimationFrame(() => tip.classList.add("show"));

    setTimeout(() => {
      tip.classList.remove("show");
      setTimeout(() => {
        if (tip.parentNode) tip.parentNode.removeChild(tip);
      }, 300);
    }, duration);
  }

  Object.entries(mapping).forEach(([buttonId, contentSelector]) => {
    const button = document.getElementById(buttonId);
    if (!button) return;

    button.addEventListener("click", async (ev) => {
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
