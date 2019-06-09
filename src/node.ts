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
  CommonResponse
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
  $rawBody: RawBody | null | undefined;
  headers: Headers;

  constructor(body: CreateBody, headers: Headers) {
    const rawBody =
      body === undefined
        ? null
        : body instanceof ArrayBuffer
        ? Buffer.from(body)
        : body;

    this.headers = headers;
    this.$rawBody = rawBody;

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

    if (isStream(rawBody)) {
      if (typeof rawBody.getHeaders === "function") {
        headers.extend(rawBody.getHeaders());
      }

      return;
    }

    if (Buffer.isBuffer(rawBody)) {
      if (!headers.has("Content-Length")) {
        headers.set("Content-Length", String(rawBody.length));
      }

      return;
    }

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
    const rawBody = this.rawBody;

    if (isStream(rawBody)) {
      const clonedRawBody = rawBody.pipe(new PassThrough());
      this.$rawBody = rawBody.pipe(new PassThrough());
      return new Body(clonedRawBody, this.headers.clone());
    }

    return new Body(rawBody, this.headers.clone());
  }
}

/**
 * Node.js `Request` implementation.
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
 * Node.js `Response` implementation.
 */
export class Response extends Body implements CommonResponse<RawBody> {
  status: number;
  statusText: string;
  trailer: Promise<Headers>;

  get ok() {
    return this.status >= 200 && this.status < 300;
  }

  constructor(body: CreateBody, init: ResponseOptions = {}) {
    const headers = new Headers(init.headers);

    super(body, headers);

    this.status = init.status || 200;
    this.statusText = init.statusText || "";
    this.headers = headers;
    this.trailer = Promise.resolve<HeadersInit | undefined>(init.trailer).then(
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
