import resampler from "wave-resampler";

// esampling from 48 kHz to 16 kHz,
export function resample(
  samples: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  if (fromRate === toRate) {
    return samples;
  }

  const output = resampler.resample(samples, fromRate, toRate, {
    method: "sinc",
  });

  return new Float32Array(output);
}
