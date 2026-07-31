import { bufferToFloat32 } from "../../utils.js";
import { stereoToMono } from "../preprocessing/stereoToMono.js";
import { removeDCOffset } from "../preprocessing/removeDCOffset.js";
import { resample } from "../preprocessing/resample.js";

function peak(samples: Float32Array) {
  let max = 0;

  for (const s of samples) {
    max = Math.max(max, Math.abs(s));
  }

  return max;
}

export class VadPreprocessor {
  process(buffer: Buffer, channels: number, sampleRate: number): Float32Array {
    let audio = bufferToFloat32(buffer);

    // Stereo → Mono
    audio = stereoToMono(audio, channels);

    // Remove DC offset
    audio = removeDCOffset(audio);

    // 48 kHz → 16 kHz
    audio = resample(audio, sampleRate, 16000);

    return audio;
  }
}

export const vadPreprocessor = new VadPreprocessor();
