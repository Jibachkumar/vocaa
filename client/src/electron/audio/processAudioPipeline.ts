// sends chunks to the next stage of the pipeline

import { AudioPipeline } from "./pipeline/AudioPipeline.js";
import { TranscriptionStage } from "./pipeline/stages/TranscriptionStage.js";

// orchestrates processing
export const audioPipeline = new AudioPipeline([new TranscriptionStage()]);
