// collects PCM

import { EventEmitter } from "events";

// collecting raw bytes
export class AudioAccumulator extends EventEmitter {
  private chunks: Buffer[] = [];
  private totalBytes = 0;

  constructor(private readonly targetBytes: number) {
    super();
  }

  addChunk(chunk: Buffer) {
    this.chunks.push(chunk);
    this.totalBytes += chunk.length;

    if (this.totalBytes >= this.targetBytes) {
      const audio = Buffer.concat(this.chunks, this.totalBytes);

      this.emit("chunk", audio);

      this.chunks = [];
      this.totalBytes = 0;
    }
  }

  reset() {
    this.chunks = [];
    this.totalBytes = 0;
  }
}
