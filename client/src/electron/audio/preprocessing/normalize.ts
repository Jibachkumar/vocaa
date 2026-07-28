// normilize the audio volume for consistency
export function normalize(samples: Float32Array): Float32Array {
  let peak = 0;

  // Find absolute peak
  for (const sample of samples) {
    const abs = Math.abs(sample);

    if (abs > peak) {
      peak = abs;
    }
  }

  // Don't amplify silence
  if (peak < 0.01) {
    return samples;
  }

  const gain = 0.95 / peak;

  const output = new Float32Array(samples.length);

  for (let i = 0; i < samples.length; i++) {
    output[i] = samples[i] * gain;
  }

  return output;
}
