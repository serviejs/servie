import { once } from "@servie/events";
import { byteLength } from "byte-length";
import { expectType } from "ts-expect";
import { Readable, PassThrough } from "stream";
import { Headers, HeadersInit } from "./headers";
import { Signal } from "./signal";
import {
  CommonBody,
  useRawBody,
  EmptyBody,
  CommonRequestOptions,
  CommonResponseOptions,
  CommonRequest,
  CommonResponse,
  kBodyUsed,
  kBodyDestroyed,
  getRawBody
} from "./common";

export type RawBody = Readable | Buffer | ArrayBuffer | string;
export type CreateBody = RawBody | EmptyBody;
export type RequestOptions = CommonRequestOptions<CreateBody>;
export type ResponseOptions = CommonResponseOptions;

export * from "./headers";
export * from "./signal";

/**
 * Check if a value is a node.js stream object.
 */
function isStream(stream: any): stream is Readable {
  return (
    stream !== null &&
    typeof stream === "object" &&
    typeof stream.pipe === "function"
  );
}

/**
 * Convert a node.js `Stream` to `Buffer`.
 */
function streamToBuffer(stream: Readable): Promise<Buffer> {
  if (!stream.readable) return Promise.resolve(Buffer.alloc(0));

  return new Promise<Buffer>((resolve, reject) => {
    const buf: Buffer[] = [];

    const onData = (chunk: Buffer) => buf.push(chunk);

    const onError = (err: Error) => {
      cleanup();
      return reject(err);
    };

    const onClose = () => {
      cleanup();
      return resolve(Buffer.concat(buf));
    };

    const onEnd = (err: Error | null) => {
      cleanup();

      if (err) return reject(err);
      return resolve(Buffer.concat(buf));
    };

    const cleanup = () => {
      stream.removeListener("error", onError);
      stream.removeListener("data", onData);
      stream.removeListener("close", onClose);
      stream.removeListener("end", onEnd);
    };

    stream.addListener("error", onError);
    stream.addListener("data", onData);
    stream.addListener("close", onClose);
    stream.addListener("end", onEnd);
  });
}

/**
 * Convert a node.js `Buffer` into an `ArrayBuffer` instance.
 */
function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
}

/**
 * Node.js `Body` implementation.
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
    if (Buffer.isBuffer(rawBody)) {
      return Promise.resolve(rawBody.toString("utf8"));
    }
    if (rawBody instanceof ArrayBuffer) {
      return Promise.resolve(Buffer.from(rawBody).toString("utf8"));
    }
    return streamToBuffer(rawBody).then(x => x.toString("utf8"));
  }

  buffer(): Promise<Buffer> {
    const rawBody = useRawBody(this);
    if (rawBody === null) return Promise.resolve(Buffer.allocUnsafe(0));
    if (Buffer.isBuffer(rawBody)) return Promise.resolve(rawBody);
    if (typeof rawBody === "string") {
      return Promise.resolve(Buffer.from(rawBody));
    }
    if (rawBody instanceof ArrayBuffer) {
      return Promise.resolve(Buffer.from(rawBody));
    }
    return streamToBuffer(rawBody);
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    return this.buffer().then(bufferToArrayBuffer);
  }

  stream(): Readable {
    const rawBody = useRawBody(this);
    if (isStream(rawBody)) return rawBody;

    // Push a `Buffer`, string or `null` into the readable stream.
    let value = rawBody instanceof ArrayBuffer ? Buffer.from(rawBody) : rawBody;

    return new Readable({
      read() {
        this.push(value);
        value = null; // Force end of stream on next `read`.
      }
    });
  }

  clone(): Body {
    const rawBody = getRawBody(this);

    if (isStream(rawBody)) {
      const clonedRawBody = rawBody.pipe(new PassThrough());
      this.$rawBody = rawBody.pipe(new PassThrough());
      return new Body(clonedRawBody);
    }

    return new Body(rawBody);
  }

  destroy(): Promise<void> {
    const rawBody = getRawBody(this);
    this.$rawBody = kBodyDestroyed;

    // Destroy readable streams.
    if (isStream(rawBody)) rawBody.destroy();
    return Promise.resolve();
  }
}

/**
 * Node.js `Request` implementation.
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
 * Node.js `Response` implementation.
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

  if (isStream(rawBody)) {
    if (typeof (rawBody as any).getHeaders === "function") {
      headers.extend((rawBody as any).getHeaders());
    }

    return headers;
  }

  if (rawBody instanceof ArrayBuffer || Buffer.isBuffer(rawBody)) {
    if (!omitDefaultHeaders && !headers.has("Content-Length")) {
      headers.set("Content-Length", String(rawBody.byteLength));
    }

    return headers;
  }

  expectType<never>(rawBody);

  throw new TypeError("Unknown body type");
}
