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
    if (!(type in this.any)) return;
    this.any[type].forEach(fn => fn(...args));
    this.all.forEach(fn => fn(type, ...args));
  }
}

/**
 * Forward all events from one event emitter to the other.
 */
function forward<T>(from: Events<T>, to: Events<T>) {
  const fn = (type: keyof T, ...args: any) => to.emit(type, ...args);
  from.each(fn);
  return fn;
}

/**
 * Helper to listen to an event once only.
 */
function once<T, K extends keyof T>(
  e: Events<T>,
  type: K,
  callback: EventListener<T, K>
) {
  return e.on(type, function self(...args) {
    e.off(type, self);
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

  constructor(signal?: Signal) {
    super();

    // Inherit events emitted from the signal.
    if (signal) forward(signal, this);

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
