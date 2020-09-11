import { once } from "@servie/events";
import { byteLength } from "byte-length";
import { expectType } from "ts-expect";
import { Headers, HeadersInit } from "./headers";
import { Signal } from "./signal";
import {
  CommonBody,
  useRawBody,
  EmptyBody,
  CommonRequestOptions,
  CommonResponseOptions,
  CommonResponse,
  CommonRequest,
  kBodyUsed,
  kBodyDestroyed,
  getRawBody
} from "./common";

export type RawBody = ReadableStream | ArrayBuffer | string;
export type CreateBody = RawBody | EmptyBody;
export type RequestOptions = CommonRequestOptions<CreateBody>;
export type ResponseOptions = CommonResponseOptions;

export * from "./headers";
export * from "./signal";

/**
 * Convert array buffer to string.
 */
function arrayBufferToText(buffer: ArrayBuffer): string {
  const view = new DataView(buffer);
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(view);
}

/**
 * Convert a string to `Uint8Array`.
 */
function textToUint8Array(text: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(text);
}

/**
 * Convert browser stream to array buffer.
 */
function streamToArrayBuffer(stream: ReadableStream) {
  const reader = stream.getReader();

  function next(buffer: Uint8Array): Promise<Uint8Array> {
    return reader.read().then(result => {
      if (result.done) return buffer;

      const chunk: Uint8Array = result.value;
      const tmpBuffer = new Uint8Array(buffer.byteLength + chunk.byteLength);
      tmpBuffer.set(buffer, 0);
      tmpBuffer.set(chunk, buffer.byteLength);
      return next(tmpBuffer);
    });
  }

  return next(new Uint8Array(0));
}

/**
 * Browser `Body` implementation.
 */
export class Body implements CommonBody<RawBody> {
  $rawBody: RawBody | null | typeof kBodyUsed | typeof kBodyDestroyed;

  constructor(body: CreateBody) {
    const rawBody = body === undefined ? null : body;

    this.$rawBody = rawBody;
  }

  get bodyUsed() {
    return this.$rawBody === kBodyUsed || this.$rawBody === kBodyDestroyed;
  }

  json(): Promise<any> {
    return this.text().then(x => JSON.parse(x));
  }

  text(): Promise<string> {
    const rawBody = useRawBody(this);
    if (rawBody === null) return Promise.resolve("");
    if (typeof rawBody === "string") return Promise.resolve(rawBody);
    if (rawBody instanceof ArrayBuffer) {
      return Promise.resolve(arrayBufferToText(rawBody));
    }
    return streamToArrayBuffer(rawBody).then(arrayBufferToText);
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    const rawBody = useRawBody(this);
    if (rawBody === null) return Promise.resolve(new ArrayBuffer(0));
    if (rawBody instanceof ArrayBuffer) return Promise.resolve(rawBody);
    if (typeof rawBody === "string") {
      return Promise.resolve(textToUint8Array(rawBody).buffer);
    }
    return streamToArrayBuffer(rawBody);
  }

  readableStream(): ReadableStream<Uint8Array> {
    const rawBody = useRawBody(this);

    if (rawBody === null) {
      return new ReadableStream({
        start(controller) {
          controller.close();
        }
      });
    }

    if (typeof rawBody === "string") {
      return new ReadableStream({
        start(controller) {
          controller.enqueue(textToUint8Array(rawBody));
          controller.close();
        }
      });
    }

    if (rawBody instanceof ArrayBuffer) {
      return new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(rawBody));
          controller.close();
        }
      });
    }

    return rawBody;
  }

  clone(): Body {
    const rawBody = getRawBody(this);

    if (rawBody instanceof ReadableStream) {
      const [selfRawBody, clonedRawBody] = rawBody.tee();
      this.$rawBody = selfRawBody;
      return new Body(clonedRawBody);
    }

    return new Body(rawBody);
  }

  destroy(): Promise<void> {
    const rawBody = getRawBody(this);
    this.$rawBody = kBodyDestroyed;

    // Destroy readable streams.
    if (rawBody instanceof ReadableStream) return rawBody.cancel();
    return Promise.resolve();
  }
}

/**
 * Browser `Request` implementation.
 */
export class Request extends Body implements CommonRequest<RawBody> {
  url: string;
  method: string;
  headers: Headers;
  trailer: Promise<Headers>;
  readonly signal: Signal;

  constructor(input: string | Request, init: RequestOptions = {}) {
    // Clone request or use passed options object.
    const req = typeof input === "string" ? undefined : input.clone();
    const rawBody = init.body || (req ? getRawBody(req) : null);
    const headers =
      req && !init.headers
        ? req.headers
        : getDefaultHeaders(
            rawBody,
            init.headers,
            init.omitDefaultHeaders === true
          );

    super(rawBody);

    this.url = typeof input === "string" ? input : input.url;
    this.method = init.method || (req && req.method) || "GET";
    this.signal = init.signal || (req && req.signal) || new Signal();
    this.headers = headers;
    this.trailer =
      req && !init.trailer
        ? req.trailer
        : Promise.resolve<HeadersInit | undefined>(init.trailer).then(
            x => new Headers(x)
          );

    // Destroy body on abort.
    once(this.signal, "abort", () => this.destroy());
  }

  clone(): Request {
    const cloned = super.clone();

    return new Request(this.url, {
      body: getRawBody(cloned),
      headers: this.headers.clone(),
      omitDefaultHeaders: true,
      method: this.method,
      signal: this.signal,
      trailer: this.trailer.then(x => x.clone())
    });
  }
}

/**
 * Browser `Response` implementation.
 */
export class Response extends Body implements CommonResponse<RawBody> {
  status: number;
  statusText: string;
  headers: Headers;
  trailer: Promise<Headers>;

  get ok() {
    return this.status >= 200 && this.status < 300;
  }

  constructor(body?: CreateBody, init: ResponseOptions = {}) {
    const headers = getDefaultHeaders(
      body,
      init.headers,
      init.omitDefaultHeaders === true
    );

    super(body);

    this.status = init.status || 200;
    this.statusText = init.statusText || "";
    this.headers = headers;
    this.trailer = Promise.resolve<HeadersInit | undefined>(init.trailer).then(
      x => new Headers(x)
    );
  }

  clone(): Response {
    const cloned = super.clone();

    return new Response(getRawBody(cloned), {
      status: this.status,
      statusText: this.statusText,
      headers: this.headers.clone(),
      omitDefaultHeaders: true,
      trailer: this.trailer.then(x => x.clone())
    });
  }
}

/**
 * Get default headers for `Request` and `Response` instances.
 */
function getDefaultHeaders(
  rawBody: CreateBody,
  init: HeadersInit | undefined,
  omitDefaultHeaders: boolean
) {
  const headers = new Headers(init);

  if (rawBody === null || rawBody === undefined) return headers;

  if (typeof rawBody === "string") {
    if (!omitDefaultHeaders && !headers.has("Content-Type")) {
      headers.set("Content-Type", "text/plain");
    }

    if (!omitDefaultHeaders && !headers.has("Content-Length")) {
      headers.set("Content-Length", byteLength(rawBody).toString());
    }

    return headers;
  }

  // Default to "octet stream" for raw bodies.
  if (!omitDefaultHeaders && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/octet-stream");
  }

  if (rawBody instanceof ArrayBuffer) {
    if (!omitDefaultHeaders && !headers.has("Content-Length")) {
      headers.set("Content-Length", String(rawBody.byteLength));
    }

    return headers;
  }

  if (rawBody instanceof ReadableStream) return headers;

  expectType<never>(rawBody);

  throw new TypeError("Unknown body type");
}
