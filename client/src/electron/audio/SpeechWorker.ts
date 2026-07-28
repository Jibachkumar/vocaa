import { AudioChunk } from "../types.js";
import { audioPipeline } from "./processAudioPipeline.js";

class SpeechWorker {
  async process(chunk: AudioChunk) {
    const start = performance.now();

    try {
      await audioPipeline.process(chunk);

      console.log(
        `[Worker] Finished utterance #${chunk.sequence} in ${Math.round(
          performance.now() - start,
        )} ms`,
      );
    } catch (error) {
      console.error(`[Worker] Failed utterance #${chunk.sequence}`, error);
    }
  }
}

export const speechWorker = new SpeechWorker();
