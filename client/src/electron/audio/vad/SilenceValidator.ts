export interface ValidatedVadDecision {
  speaking: boolean;
  started: boolean;
  stopped: boolean;
  probability: number;
}

export class SilenceValidator {
  private silenceStarted = 0;
  private consecutiveSilentFrames = 0;

  private stopEmitted = false;

  constructor(
    private readonly silenceThresholdMs = 300,
    private readonly requiredSilentFrames = 10,
  ) {}

  update(decision: ValidatedVadDecision): ValidatedVadDecision {
    const now = Date.now();

    // User is speaking
    if (decision.speaking) {
      this.silenceStarted = 0;
      this.consecutiveSilentFrames = 0;
      this.stopEmitted = false;

      return decision;
    }

    // First silent frame
    if (this.silenceStarted === 0) {
      this.silenceStarted = now;
    }

    this.consecutiveSilentFrames++;

    const silenceDuration = now - this.silenceStarted;

    const stableSilence =
      silenceDuration >= this.silenceThresholdMs &&
      this.consecutiveSilentFrames >= this.requiredSilentFrames;

    if (!stableSilence) {
      return {
        ...decision,
        stopped: false,
      };
    }

    if (this.stopEmitted) {
      return {
        ...decision,
        stopped: false,
      };
    }

    this.stopEmitted = true;

    return {
      ...decision,
      stopped: true,
    };
  }

  reset() {
    this.silenceStarted = 0;
    this.consecutiveSilentFrames = 0;
    this.stopEmitted = false;
  }
}
