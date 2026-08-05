import { getNativePath } from "../pathResolver.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const native = require(getNativePath());

export class EditControlInjector {
  async inject(text: string) {
    native.replaceEditText(text);
    console.log("EditControlInjector: ", text);
  }
}
