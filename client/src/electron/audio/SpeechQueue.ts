import { AudioChunk } from "../types.js";
import { speechWorker } from "./SpeechWorker.js";

// storing pending chunks, processing them one at a time, starting the next chunk automatically when the current one finishes.
export class SpeechQueue {
  private queue: AudioChunk[] = [];
  private processing = false;

  async enqueue(chunk: AudioChunk) {
    this.queue.push(chunk);
    console.log(`Queue: ${this.queue.length} waiting`);

    if (this.processing) {
      return;
    }

    this.processing = true;

    void this.processNext();
  }

  private async processNext() {
    while (this.queue.length > 0) {
      const chunk = this.queue.shift()!;

      try {
        await speechWorker.process(chunk);
      } catch (error) {
        console.error(error);
      }
    }

    this.processing = false;
  }
}

export const speechQueue = new SpeechQueue();
