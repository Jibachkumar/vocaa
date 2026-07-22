//  converting Float32Array to Encode as WAV Buffer
export function encodeWav(
  samples: Float32Array,
  sampleRate: number,
  channels: number,
): Buffer {
  //   console.log(samples.length);
  //   console.log(sampleRate);
  //   console.log(channels);

  //   Allocate buffer
  const bytesPerSample = 2; // 16-bit PCM

  const dataSize = samples.length * bytesPerSample;

  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write("RIFF", 0);

  buffer.writeUInt32LE(36 + dataSize, 4);

  buffer.write("WAVE", 8);

  // fmt chunk
  // This format block  contains 16 bytes.
  buffer.write("fmt ", 12);

  buffer.writeUInt32LE(16, 16); // PCM header size

  buffer.writeUInt16LE(1, 20); // PCM format

  buffer.writeUInt16LE(channels, 22);

  buffer.writeUInt32LE(sampleRate, 24);

  buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28);

  buffer.writeUInt16LE(channels * bytesPerSample, 32);

  buffer.writeUInt16LE(16, 34); // bits per sample

  //   data chunk
  buffer.write("data", 36);

  buffer.writeUInt32LE(dataSize, 40);

  // Convert Float32 → Int16
  let offset = 44;

  for (const sample of samples) {
    // Clamp to [-1, 1]
    const clamped = Math.max(-1, Math.min(1, sample));

    // Convert Float32 -> Int16
    const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;

    buffer.writeInt16LE(int16, offset);

    offset += 2;
  }

  console.log("Final offset:", offset);
  console.log("Buffer size :", buffer.length);

  return buffer;
}
