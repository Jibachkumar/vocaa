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
  private readonly WEAK_SPEECH_THRESHOLD = 0.2;
  private readonly RECOVERY_FRAMES = 3;

  private weakSpeechFrames = 0;
  private lastProbability = 0;

  private speechStart = 0;
  private silenceStart = 0;
  private speechDuration = 0;

  /**
   * Detect recovering speech before Silero
   * emits another "started" event.
   */
  private detectSpeechRecovery(decision: VadDecision): boolean {
    const rising =
      decision.probability >= this.WEAK_SPEECH_THRESHOLD &&
      decision.probability >= this.lastProbability;

    if (rising) {
      this.weakSpeechFrames++;
    } else {
      this.weakSpeechFrames = 0;
    }

    this.lastProbability = decision.probability;

    if (this.weakSpeechFrames >= this.RECOVERY_FRAMES) {
      this.weakSpeechFrames = 0;
      return true;
    }

    return false;
  }

  update(decision: VadDecision): EndpointEvent {
    // speach started
    if (decision.started) {
      this.weakSpeechFrames = 0;
      this.lastProbability = 0;

      this.speechStart = Date.now();
      this.silenceStart = 0;

      return {
        type: EndpointEventType.SPEECH_STARTED,
        probability: decision.probability,
      };
    }

    // speech ended
    if (decision.stopped) {
      this.weakSpeechFrames = 0;
      this.lastProbability = 0;

      this.speechDuration = Date.now() - this.speechStart;
      this.silenceStart = Date.now();

      return {
        type: EndpointEventType.SPEECH_ENDED,
        probability: decision.probability,
      };
    }

    if (decision.speaking && this.detectSpeechRecovery(decision)) {
      return {
        type: EndpointEventType.SPEECH_RECOVERED,
        probability: decision.probability,
      };
    }

    return {
      type: EndpointEventType.NONE,
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
    this.weakSpeechFrames = 0;
    this.lastProbability = 0;

    this.speechStart = 0;
    this.speechDuration = 0;
    this.silenceStart = 0;
  }
}

export const endpointDetector = new EndpointDetector();

export { EndpointEventType };

export type { EndpointEvent, VadDecision };
