export interface NativeTextInjector {
  inject(text: string): Promise<void>;
}
