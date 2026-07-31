const BASE_DELAY = 350;
const MIN_DELAY = 300;
const MAX_DELAY = 900;

export interface EndpointContext {
  speechDurationMs: number;
  silenceDurationMs: number;
  recovering: boolean;
}

//  decides delay
export class EndpointPolicy {
  getDelay(ctx: EndpointContext): number {
    let delay = BASE_DELAY;

    // Short speech
    if (ctx.speechDurationMs < 1000) delay += 250;
    else if (ctx.speechDurationMs < 3000) delay += 100;
    // Long speech
    else if (ctx.speechDurationMs > 10000) delay -= 200;
    else if (ctx.speechDurationMs > 5000) delay -= 100;

    // Silence
    if (ctx.silenceDurationMs > 600) delay -= 150;
    else if (ctx.silenceDurationMs > 300) delay -= 75;

    // Recovery
    if (ctx.recovering) delay += 200;

    return Math.max(MIN_DELAY, Math.min(delay, MAX_DELAY));
  }
}

export const endpointPolicy = new EndpointPolicy();
