export function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

export function bufferToFloat32(buffer: Buffer): Float32Array {
  return new Float32Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.length / Float32Array.BYTES_PER_ELEMENT,
  );
}
