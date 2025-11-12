document.addEventListener("DOMContentLoaded", () => {
  const themeButton = document.querySelector("header button ion-icon").parentElement;

  let isLight = false;

  function applyTheme(lightMode) {
    const root = document.documentElement;

    if (lightMode) {
      for (const [name, value] of Object.entries(lightTheme)) {
        root.style.setProperty(name, value);
      }
      themeButton.innerHTML = '<ion-icon name="moon-outline"></ion-icon>';
      isLight = true;
      localStorage.setItem("theme", "light");
    } else {
      for (const [name, value] of Object.entries(darkTheme)) {
        root.style.setProperty(name, value);
      }
      themeButton.innerHTML = '<ion-icon name="sunny-outline"></ion-icon>';
      isLight = false;
      localStorage.setItem("theme", "dark");
    }
  }

  const darkTheme = {
    "--bg-color": "#070707",
    "--text-color": "#FAFAFA",
    "--js-color": "#f7df1e",
    "--dub-color": "#868686",
    "--codemok-bg": "#0f0f0f",
    "--codemok-bg-header-color": "#1d1d1d",
    "--codemok-border-color": "#2e2e2e",
    "--scrollbar-bg-color": "#0f0f0f",
    "--scrollbar-thumb-color": "#2e2e2e",

    "--comment": "#7a7a7a",
    "--variable": "#9cdcfe",
    "--commands": "#9044ce",
    "--operator": "#44ce5b",
    "--brackets": "#da6cd0",
    "--numbers": "#eeeb59"
  };

  const lightTheme = {
    "--bg-color": "#FAFAFA",
    "--text-color": "#070707",
    "--js-color": "#f7df1e",
    "--dub-color": "#5f5f5f",
    "--codemok-bg": "#ececec",
    "--codemok-bg-header-color": "#e9e9e9",
    "--codemok-border-color": "#e9e9e9",
    "--scrollbar-bg-color": "#ececec",
    "--scrollbar-thumb-color": "#c0c0c0",

    "--comment": "#7a7a7a",
    "--variable": "#2430cfff",
    "--commands": "#9044ce",
    "--operator": "#287234ff",
    "--brackets": "#da6cd0",
    "--numbers": "#d3a920ff",
  };

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    applyTheme(true);
  } else {
    applyTheme(false);
  }

  themeButton.addEventListener("click", () => {
    applyTheme(!isLight);
  });
});
