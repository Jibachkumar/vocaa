import * as ort from "onnxruntime-node";
import type { VoiceActivityDetector } from "./VoiceActivityDetector.js";
import { sileroSession } from "./SileroSession.js";
import { VadDecision } from "./VoiceActivityDetector.js";

class SileroVad implements VoiceActivityDetector {
  private state = new Float32Array(2 * 1 * 128);

  private context = new Float32Array(64);

  private static readonly START_THRESHOLD = 0.6;
  private static readonly STOP_THRESHOLD = 0.2;

  // 8 × 32ms = 256ms
  private static readonly HANGOVER_FRAMES = 8;

  private speaking = false;

  private previousSpeaking = false;

  private hangoverCounter = 0;

  private static readonly START_FRAMES = 2;

  private speechCounter = 0;
  private recoveryCounter = 0;

  private readonly sampleRateTensor = new ort.Tensor(
    "int64",
    new BigInt64Array([16000n]),
    [],
  );

  private getStateTensor() {
    return new ort.Tensor("float32", this.state, [2, 1, 128]);
  }

  async isSpeech(audio: Float32Array): Promise<VadDecision> {
    const session = sileroSession.getSession();

    const input = new Float32Array(64 + audio.length);

    // previous context
    input.set(this.context, 0);

    // current frame
    input.set(audio, 64);

    const inputTensor = new ort.Tensor("float32", input, [1, input.length]);

    const feeds = {
      input: inputTensor,
      state: this.getStateTensor(),
      sr: this.sampleRateTensor,
    };

    // console.log({
    //   inputLength: input.length,
    // });

    const results = await session.run(feeds);

    const probability = (results.output.data as Float32Array)[0];

    this.context.set(audio.slice(audio.length - 64));

    const nextState = results.stateN.data as Float32Array;

    // console.log({
    //   stateLength: nextState.length,
    // });

    this.state.set(nextState);

    this.previousSpeaking = this.speaking;

    // ---------- START SPEAKING ----------
    if (!this.speaking) {
      if (probability >= SileroVad.START_THRESHOLD) {
        this.speechCounter++;

        if (this.speechCounter >= SileroVad.START_FRAMES) {
          this.speaking = true;
          this.hangoverCounter = 0;
          this.speechCounter = 0;
        }
      } else {
        this.speechCounter = 0;
      }
    }

    // ---------- CURRENTLY SPEAKING ----------
    if (probability > SileroVad.STOP_THRESHOLD) {
      this.recoveryCounter++;

      if (this.recoveryCounter >= 2) {
        this.hangoverCounter = 0;
        this.recoveryCounter = 0;
      }
    } else {
      this.recoveryCounter = 0;
      this.hangoverCounter++;

      if (this.hangoverCounter >= SileroVad.HANGOVER_FRAMES) {
        this.speaking = false;
        this.hangoverCounter = 0;
      }
    }

    console.log({
      probability,
      speaking: this.speaking,
      hangover: this.hangoverCounter,
    });

    return {
      probability,
      speaking: this.speaking,
      started: !this.previousSpeaking && this.speaking,
      stopped: this.previousSpeaking && !this.speaking,
    };
  }

  reset() {
    this.state.fill(0);
    this.context.fill(0);

    this.speaking = false;
    this.previousSpeaking = false;

    this.hangoverCounter = 0;
    this.speechCounter = 0;
  }
}

export const sileroVad = new SileroVad();
