// communicates with Rust
import { createRequire } from "module";
import { getNativePath } from "../pathResolver.js";
import { AudioAccumulator } from "../audio/AudioAccumulator.js";
import { bufferToFloat32 } from "../utils.js";
import { AudioChunk } from "../types.js";
import { processAudioChunk } from "../audio/AudioProcessor.js";

const require = createRequire(import.meta.url);

const native = require(getNativePath());

const recorder = new native.AudioCapture();

let sequence = 0;

let accumulator: AudioAccumulator | null = null;

export function startNativeRecording() {
  console.log("Starting native recorder");

  // Before start()
  console.log("Before start()");
  console.log("Sample Rate:", recorder.sampleRate());
  console.log("Channels:", recorder.channels());

  // Register callback BEFORE start() (low latency)
  recorder.onAudioData((err: unknown, pcm: number[]) => {
    if (err) {
      console.error(err);
      return;
    }

    // Ignore packets until accumulator exists
    if (!accumulator) return;

    accumulator.addChunk(Buffer.from(pcm));
  });

  // Start microphone
  recorder.start();

  // After start()
  console.log("After start()");
  console.log("Recording:", recorder.isRecording());
  console.log("Sample Rate:", recorder.sampleRate());
  console.log("Channels:", recorder.channels());

  accumulator = new AudioAccumulator(
    recorder.sampleRate() * recorder.channels() * 4,
  );

  accumulator.on("chunk", (audio: Buffer) => {
    const samples = bufferToFloat32(audio);

    // console.log("=================================");
    // console.log("1 SECOND OF AUDIO READY");
    // console.log("Chunk size:", audio.length);
    // console.log("Samples:", samples.length);
    // console.log("=================================");

    const chunk: AudioChunk = {
      audio: samples,
      sampleRate: recorder.sampleRate(),
      channels: recorder.channels(),
      durationMs: 1000,
      timestamp: Date.now(),
      sequence: ++sequence,
    };

    processAudioChunk(chunk);
  });
}

export function stopNativeRecording() {
  console.log("Stopping native recorder");

  recorder.stop();

  // Clean up for next recording
  accumulator?.reset();
  accumulator = null;

  console.log("Recording:", recorder.isRecording());
}

export function isRecording() {
  return recorder.isRecording();
}
