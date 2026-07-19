import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { isDev } from "./utils.js";
import { pollResources } from "./resourceManager.js";
import { startServer, waitForServer, stopServer } from "./server.js";
import { config } from "./config.js";
import { getPathResolver } from "./pathResolver.js";
import { createOverlayWindow } from "./overlay.js";
import { registerGlobalShortcut } from "./services/shortcut.service.js";
import { getOverlayWindow } from "./overlay.js";
import { setMainWindow } from "./windowManager.js";
import { startNativeRecording, stopNativeRecording } from "./native/audio.js";

// helper for creating BrowserWindow
const createWindow = async () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: getPathResolver(),
    },
  });

  if (isDev()) {
    await mainWindow.loadURL(`${config.viteUrl}`);
  } else {
    await mainWindow.loadFile(
      path.join(app.getAppPath(), "dist-vocaa", "index.html"),
    );
  }

  return mainWindow;
};

// helper to execute all function
const bootstrap = async () => {
  try {
    startServer();

    await waitForServer();

    const mainWindow = await createWindow();

    setMainWindow(mainWindow);

    createOverlayWindow();

    pollResources();

    registerGlobalShortcut();

    // 2. Listen to clicks coming from your React frontend buttons
    ipcMain.on("overlay:show", () => {
      getOverlayWindow()?.show();
    });

    setTimeout(() => {
      console.log("Calling startNativeRecording");
      startNativeRecording();
    }, 3000);

    setTimeout(() => {
      console.log("Calling stopNativeRecording");
      stopNativeRecording();
    }, 10000);

    return mainWindow;
  } catch (err) {
    console.error(err);
    app.quit();
  }
};

app.whenReady().then(bootstrap);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", stopServer);
