import { globalShortcut } from "electron";
import { getMainWindow } from "../windowManager.js";

const registerGlobalShortcut = () => {
  globalShortcut.register("CommandOrControl+Shift+Space", () => {
    const mainWindow = getMainWindow();

    console.log("Main exists:", !!mainWindow);
    console.log("Main destroyed:", mainWindow?.isDestroyed());

    mainWindow?.webContents.send("shortcut-pressed");
  });
};

export { registerGlobalShortcut };
