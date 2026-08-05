import { NativeTextInjector } from "./NativeTextInjector.js";
import { windowsNative } from "../services/WindowsNative.js";

export class KeyboardInjector implements NativeTextInjector {
  async inject(text: string): Promise<void> {
    await windowsNative.typeText(text);
  }
}
