import { AudioChunk } from "../types.js";
import { sendToBackend } from "../services/BackendService.js";

// transcription workflow
export async function transcribeAudio(chunk: AudioChunk): Promise<string> {
  const result = await sendToBackend(chunk);

  return result.transcript;
}
