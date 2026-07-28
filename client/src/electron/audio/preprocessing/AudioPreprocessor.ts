import type { AudioChunk } from "../../types.js";
import { stereoToMono } from "./stereoToMono.js";
import { removeDCOffset } from "./removeDCOffset.js";
import { normalize } from "./normalize.js";

// import { resample } from "./resample.js";

class AudioPreprocessor {
  process(chunk: AudioChunk): AudioChunk {
    let audio = chunk.audio;

    // Stereo → Mono
    audio = stereoToMono(audio, chunk.channels);

    // Remove DC
    audio = removeDCOffset(audio);

    // Normalize
    audio = normalize(audio);

    return {
      ...chunk,
      audio,
      channels: 1,
    };
  }
}

export const audioPreprocessor = new AudioPreprocessor();
