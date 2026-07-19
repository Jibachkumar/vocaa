import path from "path";
import { isDev } from "./utils.js";
import { exec, ChildProcess } from "child_process";
import { config } from "./config.js";

let serverProcess: ChildProcess | undefined;

// helper for server starting
const startServer = () => {
  const serverPath = path.resolve(process.cwd(), "../server");

  if (isDev()) {
    serverProcess = exec("npm run dev", {
      cwd: serverPath,
    });

    serverProcess.stdout?.on("data", (data) => {
      console.log(`[SERVER] ${data}`);
    });

    serverProcess.stderr?.on("data", (data) => {
      console.error(`[SERVER ERROR] ${data}`);
    });
  } else {
    // serverProcess = exec(process.execPath, [
    //   path.join(process.resourcesPath, "server", "dist", "index.js"),
    // ]);
  }
};

// helper for checking server is started or not before the browerWindow started
const waitForServer = async (timeout = 30000) => {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(`${config.serverUrl}/server-check`);

      if (response.ok) {
        console.log("Server is ready");
        return;
      }
    } catch {
      console.log("Server isn't ready yet");
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error("Server failed to start within 30 seconds.");
};

const stopServer = () => {
  serverProcess?.kill();
};

export { startServer, waitForServer, stopServer };
