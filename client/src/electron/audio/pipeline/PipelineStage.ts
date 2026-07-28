import { AudioChunk } from "../../types.js";

export interface PipelineStage {
  process(chunk: AudioChunk): Promise<AudioChunk | null>;
}
