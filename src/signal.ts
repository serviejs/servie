/**
 * Event listener type.
 */
type EventListener<T, K extends keyof T> = (
  ...args: (T & Record<PropertyKey, any[]>)[K]
) => void;

/**
 * Wildcard event listener type.
 */
type EachEventListener<T> = {
  [K in keyof T]: (
    type: K,
    ...args: (T & Record<PropertyKey, any[]>)[K]
  ) => void
}[keyof T];

/**
 * Type-safe event emitter.
 */
class Events<T> {
  all: Array<EachEventListener<T>> = [];
  any: { [K in keyof T]: Array<EventListener<T, K>> } = Object.create(null);

  on<K extends keyof T>(type: K, callback: EventListener<T, K>) {
    (this.any[type] = this.any[type] || []).push(callback);
  }

  off<K extends keyof T>(type: K, callback: EventListener<T, K>) {
    const stack = this.any[type] || [];
    stack.splice(stack.indexOf(callback) >>> 0, 1);
  }

  each(callback: EachEventListener<T>) {
    this.all.push(callback);
  }

  none(callback: EachEventListener<T>) {
    this.all.splice(this.all.indexOf(callback) >>> 0, 1);
  }

  emit<K extends keyof T>(
    type: K,
    ...args: (T & Record<PropertyKey, any[]>)[K]
  ) {
    (this.any[type] || []).slice().forEach(fn => fn(...args));
    this.all.slice().forEach(fn => fn(type, ...args));
  }
}

/**
 * Helper to listen to an event once only.
 */
function once<T, K extends keyof T>(
  e: Events<T>,
  type: K,
  callback: EventListener<T, K>
) {
  return e.on(type, function once(...args) {
    e.off(type, once);
    callback(...args);
  });
}

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
export class Signal extends Events<SignalEvents> {
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
