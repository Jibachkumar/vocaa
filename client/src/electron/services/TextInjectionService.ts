import { injectionManager } from "../injection/InjectionManager.js";

export class TextInjectionService {
  constructor(private readonly injector = injectionManager) {}

  async inject(text: string): Promise<void> {
    if (!text.trim()) return;

    await this.injector.inject(text);
  }
}

export const textInjectionService = new TextInjectionService();
