enum EndpointEventType {
  NONE,
  SPEECH_STARTED,
  SPEECH_ENDED,
  SPEECH_RECOVERED,
}

interface EndpointEvent {
  type: EndpointEventType;
  probability: number;
}

interface VadDecision {
  probability: number;
  speaking: boolean;
  started: boolean;
  stopped: boolean;
}

export class EndpointDetector {
  private speechStart = 0;
  private silenceStart = 0;
  private speechDuration = 0;
  private hasActiveSpeech = false;

  private readonly STRONG_RECOVERY_PROBABILITY = 0.85;

  private isSpeechRecovery(decision: VadDecision): boolean {
    if (!decision.speaking) return false;

    if (this.silenceStart === 0) return false;

    const silenceMs = Date.now() - this.silenceStart;

    // 0-500 ms silence Tiny pause → always recover
    if (silenceMs < 500) {
      console.log(`Recovery: immediate (${silenceMs} ms)`);
      // this.silenceStart = 0;
      return true;
    }

    // 500–800 ms silence Medium pause → require strong confidence
    if (
      silenceMs < 800 &&
      decision.probability > this.STRONG_RECOVERY_PROBABILITY
    ) {
      console.log(
        `Recovery: high confidence (${silenceMs} ms, p=${decision.probability})`,
      );

      return true;
    }

    // > 800 ms silence Long pause → new sentence
    return false;
  }

  update(decision: VadDecision): EndpointEvent {
    // ------------------------------------------------------------
    // Speech End
    // ------------------------------------------------------------
    if (decision.stopped) {
      if (!this.hasActiveSpeech) {
        return {
          type: EndpointEventType.NONE,
          probability: decision.probability,
        };
      }

      this.hasActiveSpeech = false;
      this.speechDuration = Date.now() - this.speechStart;
      this.silenceStart = Date.now();

      return {
        type: EndpointEventType.SPEECH_ENDED,
        probability: decision.probability,
      };
    }

    // ------------------------------------------------------------
    // Speech resumed after a silence
    // ------------------------------------------------------------
    if (decision.speaking && this.silenceStart !== 0) {
      // Short pause -> same utterance
      if (this.isSpeechRecovery(decision)) {
        this.hasActiveSpeech = true;
        this.speechStart = Date.now();
        this.silenceStart = 0;

        return {
          type: EndpointEventType.SPEECH_RECOVERED,
          probability: decision.probability,
        };
      }

      // Long pause -> new utterance
      this.hasActiveSpeech = true;
      this.speechStart = Date.now();
      this.silenceStart = 0;

      return {
        type: EndpointEventType.SPEECH_STARTED,
        probability: decision.probability,
      };
    }

    // ------------------------------------------------------------
    // Ignore ordinary frames
    // ------------------------------------------------------------
    if (!decision.started) {
      return {
        type: EndpointEventType.NONE,
        probability: decision.probability,
      };
    }

    // ------------------------------------------------------------
    // First speech after recording starts
    // ------------------------------------------------------------
    // Ignore duplicate START events
    if (this.hasActiveSpeech) {
      return {
        type: EndpointEventType.NONE,
        probability: decision.probability,
      };
    }

    this.hasActiveSpeech = true;
    this.speechStart = Date.now();
    this.silenceStart = 0;

    return {
      type: EndpointEventType.SPEECH_STARTED,
      probability: decision.probability,
    };
  }

  getSpeechDuration() {
    return this.speechDuration;
  }

  getSilenceDuration() {
    if (this.silenceStart === 0) return 0;

    return Date.now() - this.silenceStart;
  }

  reset() {
    console.log("EndpointDetector.reset()");
    this.speechStart = 0;
    this.speechDuration = 0;
    this.silenceStart = 0;
    this.hasActiveSpeech = false;
  }
}

export const endpointDetector = new EndpointDetector();

export { EndpointEventType };

export type { EndpointEvent, VadDecision };
