export function stereoToMono(
  samples: Float32Array,
  channels: number,
): Float32Array {
  // Already mono
  if (channels === 1) {
    return samples;
  }

  // Stereo
  if (channels === 2) {
    const mono = new Float32Array(samples.length / 2);

    let j = 0;

    for (let i = 0; i < samples.length; i += 2) {
      mono[j++] = (samples[i] + samples[i + 1]) * 0.5;
    }

    return mono;
  }

  throw new Error(`Unsupported channel count: ${channels}`);
}
