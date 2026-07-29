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

const getSileroModelPath = () => {
  if (isDev()) {
    return path.join(
      app.getAppPath(),
      "src",
      "assets",
      "models",
      "silero_vad.onnx",
    );
  }

  return path.join(
    process.resourcesPath,
    "assets",
    "models",
    "silero_vad.onnx",
  );
};

export { getPathResolver, getNativePath, getSileroModelPath };

/*
NOTE: when i did packing i will change the 
"extraResources": [
    {
      "from": "src/assets/models",
      "to": "assets/models"
    },
    {
      "from": "dist-electron/preload.cjs",
      "to": "preload.cjs"
    }
  ], 
*/
