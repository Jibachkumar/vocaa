import path from "path";
import { app } from "electron";
import { isDev } from "./utils.js";

const getPathResolver = () => {
  return path.join(
    app.getAppPath(),
    isDev() ? "." : "..",
    "/dist-electron/preload.cjs",
  );
};

const getNativePath = () => {
  if (isDev()) {
    return path.join(
      app.getAppPath(),
      "..",
      "native",
      "audio-capture",
      "audio-capture.win32-x64-msvc.node",
    );
  }

  return path.join(
    process.resourcesPath,
    "native",
    "audio-capture.win32-x64-msvc.node",
  );
};

export { getPathResolver, getNativePath };
