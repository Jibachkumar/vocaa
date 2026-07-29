export interface VadDecision {
  probability: number;

  speaking: boolean;

  started: boolean;

  stopped: boolean;
}

export interface VoiceActivityDetector {
  isSpeech(audio: Float32Array): Promise<VadDecision>;
}
