import { getNativePath } from "../../pathResolver.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const native = require(getNativePath());

export class NativeAddon {
  async typeText(text: string): Promise<void> {
    native.findEditTarget();

    native.injectText(text);
    console.log("NativeAddon: ", text);

    // TODO:
    // call napi module
  }
}

export const nativeAddon = new NativeAddon();
