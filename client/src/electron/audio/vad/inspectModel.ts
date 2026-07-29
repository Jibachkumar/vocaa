import * as ort from "onnxruntime-node";
import { getSileroModelPath } from "../../pathResolver.js";

async function inspect() {
  const session = await ort.InferenceSession.create(getSileroModelPath());

  console.log("========== INPUTS ==========");

  for (const input of session.inputNames) {
    console.log(input);
  }

  console.log("========== OUTPUTS ==========");

  for (const output of session.outputNames) {
    console.log(output);
  }

  console.log("========== INPUT METADATA ==========");

  console.log(session.inputMetadata);

  console.log("========== OUTPUT METADATA ==========");

  console.log(session.outputMetadata);
}

inspect().catch(console.error);

export { inspect };
