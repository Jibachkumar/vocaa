export interface AudioChunk {
  /** Normalized PCM samples (-1.0 to 1.0) */
  audio: Float32Array;

  /** Sample rate (48000, 16000, etc.) */
  sampleRate: number;

  /** Number of channels */
  channels: number;

  /** Duration of this chunk in milliseconds */
  durationMs: number;

  /** Unix timestamp when this chunk was created */
  timestamp: number;

  /** Incrementing chunk id */
  sequence: number;
}
