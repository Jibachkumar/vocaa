const { contextBridge, ipcRenderer } = require("electron");

// helper to give access certain electron feature to the browserWindow
contextBridge.exposeInMainWorld("electron", {
  // Renderer asks Electron to show overlay
  showOverlay: () => ipcRenderer.send("overlay:show"),

  onShortcutPressed: (callback: () => void) => {
    ipcRenderer.on("shortcut-pressed", () => {
      callback();
    });
  },
});
