import { BrowserWindow, screen, app } from "electron";
import path from "path";
import { isDev } from "./utils.js";
import { config } from "./config.js";
import { getPathResolver } from "./pathResolver.js";

let overlayWindow: BrowserWindow | null = null;

export function createOverlayWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  overlayWindow = new BrowserWindow({
    width: 70,
    height: 24,

    x: Math.floor(width / 2 - 35),
    y: height - 60,

    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    focusable: false,
    // acceptFirstMouse: true,

    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: getPathResolver(),
    },
  });

  if (isDev()) {
    overlayWindow.loadURL(`${config.viteUrl}/overlay`);
  } else {
    overlayWindow.loadFile(
      path.join(app.getAppPath(), "dist-vocaa", "overlay.html"),
      {
        hash: "/overlay",
      },
    );
  }

  overlayWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
  });

  overlayWindow.setAlwaysOnTop(true, "screen-saver");

  overlayWindow.on("closed", () => {
    overlayWindow = null;
  });

  return overlayWindow;
}

export function getOverlayWindow() {
  return overlayWindow;
}
