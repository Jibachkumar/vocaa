// load the ONNX model exactly once

import * as ort from "onnxruntime-node";
import { getSileroModelPath } from "../../pathResolver.js";

class SileroSession {
  private session: ort.InferenceSession | null = null;

  async load() {
    if (this.session) return;

    this.session = await ort.InferenceSession.create(getSileroModelPath());

    console.log("Silero VAD model loaded");
  }

  getSession() {
    if (!this.session) {
      throw new Error("Silero session not loaded");
    }

    return this.session;
  }
}

export const sileroSession = new SileroSession();
