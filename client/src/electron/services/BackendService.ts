import { config } from "../config.js";
import { AudioChunk } from "../types.js";

export async function sendToBackend(chunk: AudioChunk) {
  try {
    const form = new FormData();

    const arrayBuffer = chunk.audio.buffer.slice(
      chunk.audio.byteOffset,
      chunk.audio.byteOffset + chunk.audio.byteLength,
    ) as ArrayBuffer;

    const file = new File([arrayBuffer], "audio.pcm", {
      type: "application/octet-stream",
    });

    form.append("audio", file);
    form.append("sampleRate", chunk.sampleRate.toString());
    form.append("channels", chunk.channels.toString());
    form.append("durationMs", chunk.durationMs.toString());
    form.append("timestamp", chunk.timestamp.toString());
    form.append("sequence", chunk.sequence.toString());

    const response = await fetch(`${config.serverUrl}/audio/transcribe`, {
      method: "POST",
      body: form,
    });

    if (!response.ok) {
      throw new Error(`Backend error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Backend request failed:");
    console.error(error);
    throw error;
  }
}
