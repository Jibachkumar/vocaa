import { AudioChunk } from "../../../types.js";
import { PipelineStage } from "../PipelineStage.js";
import { transcribeAudio } from "../../TranscriptionService.js";

export class TranscriptionStage implements PipelineStage {
  async process(chunk: AudioChunk) {
    chunk.transcript = await transcribeAudio(chunk);

    return chunk;
  }
}
