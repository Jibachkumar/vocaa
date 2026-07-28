// make the audio level consistent
export function removeDCOffset(samples: Float32Array): Float32Array {
  let mean = 0;

  for (const sample of samples) {
    mean += sample;
  }

  mean /= samples.length;

  const output = new Float32Array(samples.length);

  for (let i = 0; i < samples.length; i++) {
    output[i] = samples[i] - mean;
  }

  return output;
}
