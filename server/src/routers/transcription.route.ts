import { Router } from "express";
import { transcribeAudio } from "../controllers/transcription.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const transcribeRouter = Router();

transcribeRouter
  .route("/transcribe")
  .post(upload.single("audio"), transcribeAudio);

export { transcribeRouter };
