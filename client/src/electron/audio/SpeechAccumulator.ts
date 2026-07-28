import { EventEmitter } from "events";
import { SpeechSegment } from "../types.js";

export class SpeechAccumulator extends EventEmitter {
  private chunks: Buffer[] = [];
  private totalBytes = 0;

  constructor(
    private readonly sampleRate: number,
    private readonly channels: number,
  ) {
    super();
  }

  addChunk(chunk: Buffer) {
    this.chunks.push(chunk);
    this.totalBytes += chunk.length;
  }

  hasData() {
    return this.totalBytes > 0;
  }

  flush() {
    if (!this.hasData()) {
      return;
    }

    const audio = Buffer.concat(this.chunks, this.totalBytes);

    const samples =
      this.totalBytes / (Float32Array.BYTES_PER_ELEMENT * this.channels);

    const segment: SpeechSegment = {
      audio,
      samples,
    };

    this.emit("segment", segment);

    this.reset();
  }

  reset() {
    this.chunks = [];
    this.totalBytes = 0;
  }
}
