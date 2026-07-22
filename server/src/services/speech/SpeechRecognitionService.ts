// import { CanaryProvider } from "../providers/CanaryProvider.js";
import { ParakeetProvider } from "../providers/ParakeetProvider.js";
import type { AudioChunk } from "../../type.js";

export class SpeechService {
  private provider = new ParakeetProvider();

  async transcribe(chunk: AudioChunk) {
    return this.provider.transcribe(chunk);
  }
}
