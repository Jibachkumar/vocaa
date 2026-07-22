// sends chunks to the next stage of the pipeline

import { AudioChunk } from "../types.js";
import { transcribeAudio } from "./TranscriptionService.js";

// orchestrates processing
export async function processAudioChunk(chunk: AudioChunk) {
  await transcribeAudio(chunk);
}
