import { endpointPolicy } from "./EndpointPolicy.js";

export interface EndpointContext {
  speechDurationMs: number;
  silenceDurationMs: number;
  recovering: boolean;
}

// the class own endpoint timer, restart, cancel, policy and flush callback
export class EndpointController {
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly onEndpoint: () => void) {}

  schedule(context: EndpointContext) {
    this.cancel();

    const delay = endpointPolicy.getDelay(context);

    console.log(`[Endpoint] Scheduled in ${delay} ms`);

    this.timer = setTimeout(() => {
      this.timer = null;

      try {
        this.onEndpoint();
      } catch (err) {
        console.error("Endpoint callback failed:", err);
      }
    }, delay);
  }

  cancel() {
    if (!this.timer) return;

    clearTimeout(this.timer);
    this.timer = null;
    console.log("[Endpoint] Cancelled");
  }

  isRunning() {
    return this.timer !== null;
  }
}
