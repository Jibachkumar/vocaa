import { KeyboardInjector } from "./KeyboardInjector.js";
import { EditControlInjector } from "./EditControlInjector.js";
import { getNativePath } from "../pathResolver.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const native = require(getNativePath());

export class InjectionManager {
  private readonly keyboard = new KeyboardInjector();

  private readonly edit = new EditControlInjector();

  async inject(text: string) {
    const info = native.getForegroundWindowInfo();

    const hasEdit = await native.hasEditTarget();

    console.log("Window Info:", info);
    console.log("Process:", info.processName);
    console.log("Class:", info.className);

    if (hasEdit) {
      console.log("Has Edit Target:", hasEdit);
      return this.edit.inject(text);
    }

    console.log("Using KeyboardInjector");
    return this.keyboard.inject(text);
  }
}

export const injectionManager = new InjectionManager();
