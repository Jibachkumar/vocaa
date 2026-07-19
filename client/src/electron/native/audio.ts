import { createRequire } from "module";
import { getNativePath } from "../pathResolver.js";

const require = createRequire(import.meta.url);

// const native = require("../../../../native/audio-capture/audio-capture.win32-x64-msvc.node");
const native = require(getNativePath());

const recorder = new native.AudioCapture();

export function startNativeRecording() {
  console.log("Starting native recorder");

  recorder.start();

  console.log("Recording:", recorder.isRecording());
  console.log("Sample rate:", recorder.sampleRate());
  console.log("Channels:", recorder.channels());
}

export function stopNativeRecording() {
  console.log("Stopping native recorder");

  recorder.stop();

  console.log("Recording:", recorder.isRecording());
}

export function isRecording() {
  return recorder.isRecording();
}
