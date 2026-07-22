import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { SpeechService } from "../services/speech/SpeechRecognitionService.js";
import type { AudioChunk } from "../type.js";

const speech = new SpeechService();

const transcribeAudio = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.file) {
    throw new ApiError(400, "Audio file is required");
  }

  const audio = new Float32Array(
    req.file.buffer.buffer,
    req.file.buffer.byteOffset,
    req.file.buffer.length / Float32Array.BYTES_PER_ELEMENT,
  );
  const chunk: AudioChunk = {
    audio,
    sampleRate: Number(req.body.sampleRate),
    channels: Number(req.body.channels),
    durationMs: Number(req.body.durationMs),
    timestamp: Number(req.body.timestamp),
    sequence: Number(req.body.sequence),
  };

  try {
    const transcript = await speech.transcribe(chunk);

    return res.json({
      success: true,
      transcript,
    });
  } catch (error) {
    console.error("Transcription error:", error);
    next(error);
  }
};

export { transcribeAudio };
