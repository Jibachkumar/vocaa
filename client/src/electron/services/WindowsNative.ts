import { nativeAddon } from "../native/addon/index.js";
export class WindowsNative {
  async typeText(text: string): Promise<void> {
    await nativeAddon.typeText(text);

    // later:
    // invoke native addon
  }
}

export const windowsNative = new WindowsNative();
