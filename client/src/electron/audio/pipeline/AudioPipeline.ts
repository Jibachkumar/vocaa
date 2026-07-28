import { AudioChunk } from "../../types.js";
import { PipelineStage } from "./PipelineStage.js";

export class AudioPipeline {
  constructor(private readonly stages: PipelineStage[]) {}

  async process(chunk: AudioChunk) {
    let current: AudioChunk | null = chunk;

    for (const stage of this.stages) {
      if (!current) {
        return;
      }

      current = await stage.process(current);
    }
  }
}
