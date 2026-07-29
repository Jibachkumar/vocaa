// communicates with Rust
import { createRequire } from "module";
import { getNativePath } from "../pathResolver.js";
import { SpeechAccumulator } from "../audio/SpeechAccumulator.js";
import { bufferToFloat32 } from "../utils.js";
import { AudioChunk } from "../types.js";
import { speechQueue } from "../audio/SpeechQueue.js";
import { audioPreprocessor } from "../audio/preprocessing/AudioPreprocessor.js";
import { vadPreprocessor } from "../audio/vad/VadPreprocessor.js";
import { sileroVad } from "../audio/vad/SileroVad.js";
import { vadAccumulator } from "../audio/vad/VadFrameAccumulator.js";
import { PreRollBuffer } from "../audio/vad/PreRollBuffer.js";
import { SpeechSegment } from "../types.js";
import {
  endpointDetector,
  EndpointEventType,
} from "../audio/vad/FrameEndpointDetector.js";
import { EndpointController } from "../audio/vad/EndPointContoller.js";

const require = createRequire(import.meta.url);

const native = require(getNativePath());

const recorder = new native.AudioCapture();

let preRoll: PreRollBuffer | null = null;

let accumulator: SpeechAccumulator | null = null;

const PRE_ROLL_MS = 300;
let sequence = 0;
let initialized = false;

let recordingConfig = {
  sampleRate: 0,
  channels: 0,
};

enum RecorderState {
  IDLE,
  WAITING_FOR_SPEECH,
  COLLECTING,
  WAITING_ENDPOINT,
}

let state = RecorderState.IDLE;

const endpointController = new EndpointController(() => {
  endpointController.cancel();
  if (state !== RecorderState.WAITING_ENDPOINT) return;

  console.log(`Endpoint timeout`);

  if (accumulator?.hasData()) accumulator.flush();

  state = RecorderState.WAITING_FOR_SPEECH;

  preRoll?.reset();
  endpointDetector.reset();
});

function initializeAudioPipeline() {
  if (initialized) {
    return;
  }

  initialized = true;

  recorder.onAudioData(onAudioData);

  vadAccumulator.on("frame", onVadFrame);
}

function onAudioData(err: unknown, pcm: number[]) {
  if (!accumulator || !preRoll) return;

  if (err) {
    console.error(err);
    return;
  }

  const nativeBuffer = Buffer.from(pcm);

  if (
    state === RecorderState.WAITING_FOR_SPEECH ||
    state === RecorderState.WAITING_ENDPOINT
  ) {
    preRoll.add(nativeBuffer);
  }

  if (
    state === RecorderState.COLLECTING ||
    state === RecorderState.WAITING_ENDPOINT
  ) {
    accumulator.addChunk(nativeBuffer);
  }

  const vadAudio = vadPreprocessor.process(
    nativeBuffer,
    recordingConfig.channels,
    recordingConfig.sampleRate,
  );

  vadAccumulator.addChunk(vadAudio);
}

async function onVadFrame(frame: Float32Array) {
  try {
    const decision = await sileroVad.isSpeech(frame);

    // console.log(decision);

    if (!accumulator || !preRoll) return;

    const event = endpointDetector.update(decision);

    // Detect recovering speech before Silero emits a full "started" event.
    switch (event.type) {
      case EndpointEventType.SPEECH_RECOVERED: {
        if (state !== RecorderState.WAITING_ENDPOINT) break;

        console.log("Speech recovery detected -> restarting endpoint");

        endpointController.schedule({
          speechDurationMs: endpointDetector.getSpeechDuration(),
          silenceDurationMs: endpointDetector.getSilenceDuration(),
          recovering: true,
        });
      }

      // Speech just started
      case EndpointEventType.SPEECH_STARTED: {
        if (
          state !== RecorderState.WAITING_FOR_SPEECH &&
          state !== RecorderState.WAITING_ENDPOINT
        ) {
          break;
        }

        endpointController.cancel();
        console.log("Speech Started");

        if (state === RecorderState.WAITING_FOR_SPEECH) {
          const history = preRoll.getAudio();

          preRoll.reset();

          if (history.length > 0) {
            accumulator.addChunk(history);
          }
        }

        state = RecorderState.COLLECTING;

        break;
      }

      // Speech finished
      case EndpointEventType.SPEECH_ENDED: {
        if (state !== RecorderState.COLLECTING) {
          break;
        }

        console.log("Speech ended, waiting endpoint...");

        state = RecorderState.WAITING_ENDPOINT;

        endpointController.schedule({
          speechDurationMs: endpointDetector.getSpeechDuration(),
          silenceDurationMs: endpointDetector.getSilenceDuration(),
          recovering: false,
        });

        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error("Silero VAD failed:", error);
  }
}

function onSpeechSegment(segment: SpeechSegment) {
  const samples = bufferToFloat32(segment.audio);

  const durationMs = (segment.samples / recordingConfig.sampleRate) * 1000;

  const chunk: AudioChunk = {
    audio: samples,
    sampleRate: recordingConfig.sampleRate,
    channels: recordingConfig.channels,
    durationMs,
    timestamp: Date.now(),
    sequence: ++sequence,
  };

  console.log(chunk.audio.length);

  const processed = audioPreprocessor.process(chunk);

  void speechQueue.enqueue(processed);
}

export function startNativeRecording() {
  if (recorder.isRecording()) {
    console.warn("Recorder is already running.");
    return;
  }

  console.log("Starting native recorder");

  endpointController.cancel();
  endpointDetector.reset();
  state = RecorderState.WAITING_FOR_SPEECH;
  sequence = 0;

  // Silero is stateful. Every new recording should start with a fresh hidden state.
  sileroVad.reset();
  vadAccumulator.reset();

  initializeAudioPipeline();

  // Start microphone
  recorder.start();

  recordingConfig = {
    sampleRate: recorder.sampleRate(),
    channels: recorder.channels(),
  };

  // After start()
  console.log("After start()");
  console.log("Recording:", recorder.isRecording());
  console.log("Sample Rate:", recordingConfig.sampleRate);
  console.log("Channels:", recordingConfig.channels);

  const bytesPerSample = Float32Array.BYTES_PER_ELEMENT; // Float32

  const preRollBytes =
    (recordingConfig.sampleRate *
      recordingConfig.channels *
      bytesPerSample *
      PRE_ROLL_MS) /
    1000;

  accumulator = new SpeechAccumulator(
    recordingConfig.sampleRate,
    recordingConfig.channels,
  );

  preRoll = new PreRollBuffer(preRollBytes);

  accumulator.on("segment", onSpeechSegment);
}

export function stopNativeRecording() {
  if (!recorder.isRecording()) {
    return;
  }
  console.log("Stopping native recorder");

  endpointController.cancel();

  if (
    (state === RecorderState.COLLECTING ||
      state === RecorderState.WAITING_ENDPOINT) &&
    accumulator?.hasData()
  ) {
    accumulator.flush();
  }

  recorder.stop();
  endpointDetector.reset();
  state = RecorderState.IDLE;
  preRoll?.reset();
  accumulator = null;
  preRoll = null;
  vadAccumulator.reset();
  sileroVad.reset();

  console.log("Recording:", recorder.isRecording());
}

// export function isRecording() {
//   return recorder.isRecording();
// }
