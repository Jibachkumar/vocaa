import type { AudioChunk } from "../../type.js";

export interface SpeechProvider {
  transcribe(chunk: AudioChunk): Promise<string>;
}
