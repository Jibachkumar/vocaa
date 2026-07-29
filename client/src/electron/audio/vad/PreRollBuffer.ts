export class PreRollBuffer {
  private chunks: Buffer[] = [];
  private totalBytes = 0;

  constructor(private readonly maxBytes: number) {}

  add(chunk: Buffer) {
    this.chunks.push(chunk);
    this.totalBytes += chunk.length;

    while (this.totalBytes > this.maxBytes) {
      const oldest = this.chunks.shift();

      if (!oldest) break;

      this.totalBytes -= oldest.length;
    }
  }

  getAudio(): Buffer {
    return Buffer.concat(this.chunks, this.totalBytes);
  }

  reset() {
    this.chunks = [];
    this.totalBytes = 0;
  }
}
