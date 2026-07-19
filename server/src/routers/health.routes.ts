// starting the server first then only the UI gets load
import { Router } from "express";

const checkServerStartedrouter = Router();

checkServerStartedrouter.get("/", (_, res) => {
  res.status(200).json({
    status: "ok",
  });
});

export { checkServerStartedrouter };
