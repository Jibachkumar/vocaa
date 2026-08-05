// communicates with Rust
import { createRequire } from "module";
import { getNativePath } from "../pathResolver.js";
import { RecordingPipeline } from "./RecordingPipeline.js";

import { speechQueue } from "../audio/SpeechQueue.js";
import { audioPreprocessor } from "../audio/preprocessing/AudioPreprocessor.js";
import { vadPreprocessor } from "../audio/vad/VadPreprocessor.js";
import { sileroVad } from "../audio/vad/SileroVad.js";
import { vadAccumulator } from "../audio/vad/VadFrameAccumulator.js";
import { endpointDetector } from "../audio/vad/FrameEndpointDetector.js";

const require = createRequire(import.meta.url);

const native = require(getNativePath());

const recorder = new native.AudioCapture();

const pipeline = new RecordingPipeline(
  recorder,
  endpointDetector,
  vadAccumulator,
  audioPreprocessor,
  vadPreprocessor,
  sileroVad,
  speechQueue,
);

export function startNativeRecording() {
  pipeline.start();
}

export function stopNativeRecording() {
  pipeline.stop();
}

export function cancelNativeRecording() {
  pipeline.cancel();
}

// export function isRecording() {
//   return recorder.isRecording();
// }
