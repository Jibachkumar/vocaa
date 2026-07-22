import { AudioChunk } from "../types.js";
import fs from "fs";
import { sendToBackend } from "../services/BackendService.js";

// transcription workflow
export async function transcribeAudio(chunk: AudioChunk) {
  try {
    // const wav = encodeWav(mono, chunk.sampleRate, 1);

    const result = await sendToBackend(chunk);
    if (result.transcript.length > 0) {
      console.log("Transcript:", result.transcript);
    }
  } catch (error) {
    console.error("Transcription failed", error);
  }
}
