import type { SpeechProvider } from "../interfaces/SpeechProvider.js";
import { encodeWav } from "../../utils/wavEncoder.js";
import { stereoToMono } from "../../utils/stereoToMono.js";
import type { AudioChunk } from "../../type.js";
import { ApiError } from "../../utils/ApiError.js";

export class ParakeetProvider implements SpeechProvider {
  async transcribe(chunk: AudioChunk): Promise<string> {
    const mono = stereoToMono(chunk.audio);

    const wav = encodeWav(mono, chunk.sampleRate, 1);

    console.log("Audio bytes:", wav.length);

    // request body
    const form = new FormData();

    // convert into a File
    const arrayBuffer = wav.buffer.slice(
      wav.byteOffset,
      wav.byteOffset + wav.byteLength,
    ) as ArrayBuffer;

    const file = new File([arrayBuffer], "audio.wav", {
      type: "audio/wav",
    });

    form.append("file", file);

    form.append("language", "en-US");

    form.append("word_time_offsets", "True");

    const response = await fetch(
      "https://1598d209-5e27-4d3c-8079-4751568b1081.invocation.api.nvcf.nvidia.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        },
        body: form,
      },
    );

    if (!response.ok) {
      console.log("NVIDIA error: ", response);
      throw new ApiError(500, "Speech API failed");
    }

    const json = await response.json();

    return json.text.trim();
  }
}
