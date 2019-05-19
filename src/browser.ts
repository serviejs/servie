import { byteLength } from "byte-length";
import { Headers, HeadersInit } from "./headers";
import { Signal } from "./signal";
import {
  CommonBody,
  useRawBody,
  EmptyBody,
  CommonRequestOptions,
  CommonResponseOptions,
  CommonResponse,
  CommonRequest
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
  $rawBody: RawBody | null | undefined;
  headers: Headers;

  constructor(body: CreateBody, headers: Headers) {
    const rawBody = body === undefined ? null : body;

    this.$rawBody = rawBody;
    this.headers = headers;

    if (rawBody === null) return;

    if (typeof rawBody === "string") {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "text/plain");
      }

      if (!headers.has("Content-Length")) {
        headers.set("Content-Length", byteLength(rawBody).toString());
      }

      return;
    }

    // Default to "octet stream" for raw bodies.
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/octet-stream");
    }

    if (rawBody instanceof ArrayBuffer) {
      if (!headers.has("Content-Length")) {
        headers.set("Content-Length", rawBody.byteLength.toString());
      }

      return;
    }

    if (rawBody instanceof ReadableStream) return;

    throw new TypeError("Unknown body type");
  }

  get bodyUsed() {
    return this.$rawBody === undefined;
  }

  get rawBody() {
    if (this.bodyUsed) throw new TypeError("Body already used");

    return this.$rawBody as RawBody | null;
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
    const rawBody = this.rawBody;

    if (rawBody instanceof ReadableStream) {
      const [selfRawBody, clonedRawBody] = rawBody.tee();
      this.$rawBody = selfRawBody;
      return new Body(clonedRawBody, this.headers.clone());
    }

    return new Body(rawBody, this.headers.clone());
  }
}

/**
 * Browser `Request` implementation.
 */
export class Request extends Body implements CommonRequest<RawBody> {
  url: string;
  method: string;
  signal: Signal;
  trailer: Promise<Headers>;

  constructor(input: string | Request, init: RequestOptions = {}) {
    // Clone request or use passed options object.
    const opts = typeof input === "string" ? init : input.clone();
    const headers = new Headers(init.headers || opts.headers);
    const rawBody =
      init.body || (opts instanceof Request ? opts.rawBody : null);

    super(rawBody, headers);

    this.url = typeof input === "string" ? input : input.url;
    this.method = init.method || opts.method || "GET";
    this.signal = init.signal || opts.signal || new Signal();
    this.headers = headers;
    this.trailer = Promise.resolve<HeadersInit | undefined>(
      init.trailer || opts.trailer
    ).then(x => new Headers(x));
  }

  clone(): Request {
    const { rawBody, headers } = super.clone();

    return new Request(this.url, {
      body: rawBody,
      signal: this.signal,
      headers,
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
  trailer: Promise<Headers>;

  get ok() {
    return this.status >= 200 && this.status < 300;
  }

  constructor(body: CreateBody, opts: ResponseOptions = {}) {
    const headers = new Headers(opts.headers);

    super(body, headers);

    this.status = opts.status || 200;
    this.statusText = opts.statusText || "";
    this.headers = headers;
    this.trailer = Promise.resolve<HeadersInit | undefined>(opts.trailer).then(
      x => new Headers(x)
    );
  }

  clone(): Response {
    const { rawBody, headers } = super.clone();

    return new Response(rawBody, {
      status: this.status,
      statusText: this.statusText,
      headers,
      trailer: this.trailer.then(x => x.clone())
    });
  }
}
