import { NativeTextInjector } from "../injection/NativeTextInjector.js";
import { WindowsTextInjector } from "../injection/WindowsTextInjector.js";

export class TextInjectionService {
  constructor(
    private readonly injector: NativeTextInjector = new WindowsTextInjector(),
  ) {}

  async inject(text: string): Promise<void> {
    if (!text.trim()) return;

    await this.injector.inject(text);
  }
}

export const textInjectionService = new TextInjectionService();
