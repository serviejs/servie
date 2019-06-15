import { once } from "@servie/events";
import { byteLength } from "byte-length";
import { Readable, PassThrough } from "stream";
import { HeadersObject, Headers, HeadersInit } from "./headers";
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

export type RawBody = Readable | Buffer | string;
export type CreateBody = RawBody | ArrayBuffer | EmptyBody;
export type RequestOptions = CommonRequestOptions<CreateBody>;
export type ResponseOptions = CommonResponseOptions;

export * from "./headers";
export * from "./signal";

/**
 * Check if a value is a node.js stream object.
 */
function isStream(
  stream: any
): stream is Readable & { getHeaders?(): HeadersObject } {
  return (
    stream !== null &&
    typeof stream === "object" &&
    typeof stream.pipe === "function"
  );
}

/**
 * Convert a stream to buffer.
 */
function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const buf: Buffer[] = [];
    stream.on("error", reject);
    stream.on("data", (chunk: Buffer) => buf.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(buf)));
  });
}

/**
 * Node.js `Body` implementation.
 */
export class Body implements CommonBody<RawBody> {
  $rawBody: RawBody | null | typeof kBodyUsed | typeof kBodyDestroyed;

  constructor(body: CreateBody) {
    const rawBody =
      body === undefined
        ? null
        : body instanceof ArrayBuffer && !Buffer.isBuffer(body)
        ? Buffer.from(body)
        : body;

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
    return streamToBuffer(rawBody).then(x => x.toString("utf8"));
  }

  buffer(): Promise<Buffer> {
    const rawBody = useRawBody(this);
    if (rawBody === null) return Promise.resolve(Buffer.allocUnsafe(0));
    if (Buffer.isBuffer(rawBody)) return Promise.resolve(rawBody);
    if (typeof rawBody === "string") {
      return Promise.resolve(Buffer.from(rawBody));
    }
    return streamToBuffer(rawBody);
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    return this.buffer().then(buffer => {
      return buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      );
    });
  }

  stream(): Readable {
    let rawBody = useRawBody(this);

    if (
      rawBody === null ||
      Buffer.isBuffer(rawBody) ||
      typeof rawBody === "string"
    ) {
      return new Readable({
        read() {
          this.push(rawBody);
          rawBody = null; // Force end of stream on next `read`.
        }
      });
    }

    return rawBody;
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

  if (rawBody instanceof ArrayBuffer) {
    if (!omitDefaultHeaders && !headers.has("Content-Length")) {
      headers.set("Content-Length", rawBody.byteLength.toString());
    }

    return headers;
  }

  if (rawBody instanceof ReadableStream) return headers;

  throw new TypeError("Unknown body type");
}
