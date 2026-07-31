import { AudioPreprocessor } from "../audio/preprocessing/AudioPreprocessor.js";
import { SpeechQueue } from "../audio/SpeechQueue.js";
import { SpeechAccumulator } from "../audio/SpeechAccumulator.js";

import { VadPreprocessor } from "../audio/vad/VadPreprocessor.js";
import { VadFrameAccumulator } from "../audio/vad/VadFrameAccumulator.js";
import { PreRollBuffer } from "../audio/vad/PreRollBuffer.js";
import { SileroVad } from "../audio/vad/SileroVad.js";
import { SilenceValidator } from "../audio/vad/SilenceValidator.js";
import { EndpointController } from "../audio/vad/EndPointContoller.js";

import {
  EndpointEventType,
  EndpointDetector,
} from "../audio/vad/FrameEndpointDetector.js";
import { SpeechSegment, AudioChunk } from "../types.js";
import { bufferToFloat32 } from "../utils.js";

enum RecorderState {
  IDLE,
  WAITING_FOR_SPEECH,
  COLLECTING,
  WAITING_ENDPOINT,
}

interface RecordingConfig {
  sampleRate: number;
  channels: number;
}

interface AudioCapture {
  start(): void;
  stop(): void;

  isRecording(): boolean;

  sampleRate(): number;
  channels(): number;

  onAudioData(callback: (err: unknown, pcm: number[]) => void): void;
}

export class RecordingPipeline {
  private preRoll: PreRollBuffer | null = null;
  private accumulator: SpeechAccumulator | null = null;
  private readonly endpointController: EndpointController;
  private readonly silenceValidator = new SilenceValidator();

  private static readonly PRE_ROLL_MS = 300;

  private state = RecorderState.IDLE;
  private sequence = 0;

  private recordingConfig: RecordingConfig = {
    sampleRate: 0,
    channels: 0,
  };

  private initialized = false;

  private readonly handleAudioData = this.onAudioData.bind(this);
  private readonly handleVadFrame = this.onVadFrame.bind(this);
  private readonly handleSpeechSegment = this.onSpeechSegment.bind(this);

  constructor(
    private readonly recorder: AudioCapture,
    private readonly detector: EndpointDetector,
    private readonly vadAccumulator: VadFrameAccumulator,
    private readonly preprocessor: AudioPreprocessor,
    private readonly vadPreprocessor: VadPreprocessor,
    private readonly vad: SileroVad,
    private readonly queue: SpeechQueue,
  ) {
    this.endpointController = new EndpointController(() =>
      this.onEndpointTimeout(),
    );

    this.initializeCallbacks();
  }

  // helper for accumulator creation in start function
  private createAccumulator() {
    this.accumulator = new SpeechAccumulator(
      this.recordingConfig.sampleRate,
      this.recordingConfig.channels,
    );

    this.accumulator.on("segment", this.handleSpeechSegment);
  }

  // helper for preRollBuffer in start function
  private createPreRollBuffer() {
    const bytesPerSample = Float32Array.BYTES_PER_ELEMENT;

    const preRollBytes =
      (this.recordingConfig.sampleRate *
        this.recordingConfig.channels *
        bytesPerSample *
        RecordingPipeline.PRE_ROLL_MS) /
      1000;

    this.preRoll = new PreRollBuffer(preRollBytes);
  }

  // hepler for resetting in start function
  private resetSession() {
    this.endpointController.cancel();
    this.detector.reset();
    this.vadAccumulator.reset();
    this.vad.reset();
    this.state = RecorderState.WAITING_FOR_SPEECH;
    this.sequence = 0;
    this.preRoll?.reset();
    this.silenceValidator.reset();
  }

  // starting native recording
  start() {
    if (this.recorder.isRecording()) {
      console.warn("Recorder is already running.");
      return;
    }

    console.log("Starting native recorder");

    this.resetSession();

    this.recorder.start();

    this.recordingConfig = {
      sampleRate: this.recorder.sampleRate(),
      channels: this.recorder.channels(),
    };

    console.log("After start()");
    console.log("Recording:", this.recorder.isRecording());
    console.log("Sample Rate:", this.recordingConfig.sampleRate);
    console.log("Channels:", this.recordingConfig.channels);

    this.createAccumulator();
    this.createPreRollBuffer();
  }

  // stop native recording
  stop() {
    if (!this.recorder.isRecording()) {
      return;
    }

    console.log("Stopping native recorder");

    this.endpointController.cancel();

    if (
      (this.state === RecorderState.COLLECTING ||
        this.state === RecorderState.WAITING_ENDPOINT) &&
      this.accumulator?.hasData()
    ) {
      this.accumulator.flush();
    }

    this.recorder.stop();
    this.preRoll?.reset();
    this.detector.reset();
    this.state = RecorderState.IDLE;

    this.accumulator?.removeAllListeners();
    this.accumulator = null;
    this.preRoll = null;

    this.vadAccumulator.reset();
    this.vad.reset();
    this.silenceValidator.reset();

    console.log("Recording:", this.recorder.isRecording());
  }

  // helper for initializing audio pipeline function
  private initializeCallbacks() {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    this.recorder.onAudioData(this.handleAudioData);

    this.vadAccumulator.on("frame", this.handleVadFrame);
  }

  // helper for endpoint timer
  private onEndpointTimeout() {
    // this.endpointController.cancel();

    if (this.state !== RecorderState.WAITING_ENDPOINT) return;

    console.log("Endpoint timeout");

    if (this.accumulator?.hasData()) {
      this.accumulator.flush();
    }

    this.state = RecorderState.WAITING_FOR_SPEECH;

    this.preRoll?.reset();
    this.detector.reset();
  }

  //
  private onAudioData(err: unknown, pcm: number[]) {
    if (!this.accumulator || !this.preRoll) return;

    if (err) {
      console.error(err);
      return;
    }

    const nativeBuffer = Buffer.from(pcm);

    if (
      this.state === RecorderState.WAITING_FOR_SPEECH ||
      this.state === RecorderState.WAITING_ENDPOINT
    ) {
      this.preRoll.add(nativeBuffer);
    }

    if (
      this.state === RecorderState.COLLECTING ||
      this.state === RecorderState.WAITING_ENDPOINT
    ) {
      this.accumulator.addChunk(nativeBuffer);
    }

    const vadAudio = this.vadPreprocessor.process(
      nativeBuffer,
      this.recordingConfig.channels,
      this.recordingConfig.sampleRate,
    );

    this.vadAccumulator.addChunk(vadAudio);
  }

  // vad processing function
  private async onVadFrame(frame: Float32Array) {
    try {
      const rawDecision = await this.vad.isSpeech(frame);
      const decision = this.silenceValidator.update(rawDecision);

      console.log({
        // probability: decision.probability,
        speaking: decision.speaking,
        started: decision.started,
        stopped: decision.stopped,
      });

      if (!this.accumulator || !this.preRoll) return;

      const event = this.detector.update(decision);

      // Detect recovering speech before Silero emits a full "started" event.
      switch (event.type) {
        case EndpointEventType.SPEECH_RECOVERED: {
          if (this.state !== RecorderState.WAITING_ENDPOINT) break;

          console.log("Speech recovery detected -> restarting endpoint");

          this.endpointController.cancel();

          this.state = RecorderState.COLLECTING;

          break;
        }

        // Speech just started
        case EndpointEventType.SPEECH_STARTED: {
          if (
            this.state !== RecorderState.WAITING_FOR_SPEECH &&
            this.state !== RecorderState.WAITING_ENDPOINT
          ) {
            break;
          }

          this.endpointController.cancel();
          console.log("Speech Started");

          if (this.state === RecorderState.WAITING_FOR_SPEECH) {
            const history = this.preRoll.getAudio();

            this.preRoll.reset();

            if (history.length > 0) {
              this.accumulator.addChunk(history);
            }
          }

          this.state = RecorderState.COLLECTING;

          break;
        }

        // Speech finished
        case EndpointEventType.SPEECH_ENDED: {
          if (this.state !== RecorderState.COLLECTING) {
            break;
          }

          console.log("Speech ended, waiting endpoint...");

          this.state = RecorderState.WAITING_ENDPOINT;

          this.endpointController.schedule({
            speechDurationMs: this.detector.getSpeechDuration(),
            silenceDurationMs: this.detector.getSilenceDuration(),
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

  // speech preprocessing function
  private onSpeechSegment(segment: SpeechSegment) {
    const samples = bufferToFloat32(segment.audio);

    const durationMs =
      (segment.samples / this.recordingConfig.sampleRate) * 1000;

    const chunk: AudioChunk = {
      audio: samples,
      sampleRate: this.recordingConfig.sampleRate,
      channels: this.recordingConfig.channels,
      durationMs,
      timestamp: Date.now(),
      sequence: ++this.sequence,
    };

    console.log(chunk.audio.length);

    const processed = this.preprocessor.process(chunk);

    void this.queue.enqueue(processed);
  }
}
