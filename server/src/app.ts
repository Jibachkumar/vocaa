import "dotenv/config";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { ApiError } from "./utils/ApiError.js";

const app = express();

// config helmet
app.use(
  helmet({
    xPoweredBy: false,
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(helmet.frameguard({ action: "deny" }));
app.use(helmet.noSniff());
app.use(helmet.referrerPolicy({ policy: "no-referrer" }));

// config cors
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

// express config
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// app.use(express.static("public"));

// routes declaration
import { checkServerStartedrouter } from "./routers/health.routes.js";

app.use("/api/v1/server-check", checkServerStartedrouter);

// error
app.use((err: ApiError, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    message: err.message || "Internal Server Error",
  });
});

export { app };
