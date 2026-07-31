import { AudioChunk } from "../../../types.js";
import { PipelineStage } from "../PipelineStage.js";
import { textInjectionService } from "../../../services/TextInjectionService.js";

export class InjectionStage implements PipelineStage {
  async process(chunk: AudioChunk): Promise<AudioChunk> {
    if (!chunk.transcript) {
      return chunk;
    }

    await textInjectionService.inject(chunk.transcript);

    return chunk;
  }
}
