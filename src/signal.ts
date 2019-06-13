import { Emitter, once } from "@servie/events";

/**
 * Dictionary of supported signal events.
 */
export interface SignalEvents {
  abort: [];
  requestBytes: [number];
  requestEnded: [];
  requestStarted: [];
  responseBytes: [number];
  responseEnded: [];
  responseStarted: [];
}

/**
 * Standard signal used to communicate during `request` processing.
 */
export class Signal extends Emitter<SignalEvents> {
  aborted = false;

  constructor() {
    super();

    // Listen for the abort signal.
    once(this, "abort", () => (this.aborted = true));
  }
}

/**
 * Fetch abort controller interface.
 */
export class AbortController {
  signal = new Signal();

  abort() {
    this.signal.emit("abort");
  }
}
