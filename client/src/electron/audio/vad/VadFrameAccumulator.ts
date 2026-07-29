import { EventEmitter } from "events";

// Collecting Float32 samples for Silero VAD
export class VadFrameAccumulator extends EventEmitter {
  private chunks: Float32Array[] = [];
  private totalSamples = 0;

  constructor(private readonly targetSamples: number = 512) {
    super();
  }

  addChunk(chunk: Float32Array) {
    this.chunks.push(chunk);
    this.totalSamples += chunk.length;

    while (this.totalSamples >= this.targetSamples) {
      const merged = new Float32Array(this.totalSamples);

      let offset = 0;

      for (const c of this.chunks) {
        merged.set(c, offset);
        offset += c.length;
      }

      const frame = merged.subarray(0, this.targetSamples);

      this.emit("frame", frame);

      const remaining = merged.subarray(this.targetSamples);

      this.chunks = remaining.length ? [new Float32Array(remaining)] : [];

      this.totalSamples = remaining.length;
    }
  }

  reset() {
    this.chunks = [];
    this.totalSamples = 0;
  }
}

export const vadAccumulator = new VadFrameAccumulator();
