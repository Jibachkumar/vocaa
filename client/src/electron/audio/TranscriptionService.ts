import { AudioChunk } from "../types.js";
import { sendToBackend } from "../services/BackendService.js";

// transcription workflow
export async function transcribeAudio(chunk: AudioChunk) {
  try {
    const result = await sendToBackend(chunk);

    if (result.transcript.length > 0) {
      console.log("Transcript:", result.transcript);
    }
  } catch (error) {
    console.error("Transcription failed", error);
  }
}
