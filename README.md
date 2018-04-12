# ![Servie](https://cdn.rawgit.com/serviejs/servie/master/logo.svg)

[![NPM version](https://img.shields.io/npm/v/servie.svg?style=flat)](https://npmjs.org/package/servie)
[![NPM downloads](https://img.shields.io/npm/dm/servie.svg?style=flat)](https://npmjs.org/package/servie)
[![Build status](https://img.shields.io/travis/serviejs/servie.svg?style=flat)](https://travis-ci.org/serviejs/servie)
[![Test coverage](https://img.shields.io/coveralls/serviejs/servie.svg?style=flat)](https://coveralls.io/r/serviejs/servie?branch=master)

> Standard, framework-agnostic HTTP interfaces for JavaScript servers and clients.

## Installation

```
npm install servie --save
```

## Usage

* [`throwback`](https://github.com/serviejs/throwback) Compose middleware functions into a single function
* [`servie-lambda`](https://github.com/serviejs/servie-lambda) Servie transport layer for AWS Lambda
* [`servie-http`](https://github.com/serviejs/servie-http) Servie transport layer for node.js HTTP
* [`busboy`](https://www.npmjs.com/package/busboy) A streaming parser for HTML form data
* [`qs`](https://github.com/ljharb/qs) and [`querystring`](https://nodejs.org/api/querystring.html) Parse HTTP query string to object
* [`get-body`](https://github.com/serviejs/get-body) General body parser for forms, JSON and text
* [`servie-cors`](https://github.com/serviejs/servie-cors) CORS middleware for Servie
* [`servie-route`](https://github.com/serviejs/servie-route) Routing middleware for Servie
* [`servie-mount`](https://github.com/serviejs/servie-mount) Mount Servie middleware on a path prefix
* [`servie-compat-http`](https://github.com/serviejs/servie-compat-http) Mimic node.js HTTP using Servie
* [`servie-redirect`](https://github.com/serviejs/servie-redirect) Create response objects for redirection
* [`servie-cookie-store`](https://github.com/serviejs/servie-cookie-store) API for managing client-side cookies
* [`servie-errorhandler`](https://github.com/serviejs/servie-errorhandler) Standard error handler for transport layers
* [`servie-finalhandler`](https://github.com/serviejs/servie-finalhandler) Standard final handler for transport layers
* [`http-errors`](https://github.com/jshttp/http-errors) Create HTTP errors
* [`boom`](https://github.com/hapijs/boom) HTTP-friendly error objects
* [`consolidate`](https://github.com/tj/consolidate.js) Template rendering

### `Servie`

> Base HTTP class for common request and response logic.

```ts
import { Servie } from 'servie'
```

#### Options

* `events?` An instance of `EventEmitter`
* `headers?` An instance of `Headers`
* `trailers?` An instance of `Promise<Headers>`
* `body?` An instance of `Body`

#### Properties

* `events` An event emitter for listening to the request and response lifecycle
* `headers` The headers as a `Headers` instance
* `trailers` A promise that resolves to a `Headers` instance
* `body` The request or response payload
* `started` Boolean indicating if a request/response has started
* `finished` Boolean indicating if a request/response has finished
* `bytesTransferred` The number of bytes sent in the HTTP request/response

#### Methods

* `getHeaders()` Returns the combined `Request` and `Body` headers (`Headers`)
* `clone()` Abstract method implemented by `Request` and `Response` to clone the instance (throws `TypeError` when `started == true`)

#### Events

* `headers` Emitted when the `headers` property is changed
* `trailers` Emitted when the `trailers` property is changed
* `started` Emitted when `started` is changed to `true`
* `finished` Emitted when `finished` is changed to `true`
* `progress` Emitted when `bytesTransferred` increments

### `Request`

> HTTP class for encapsulating a `Request`, extends `Servie`.

```ts
import { Request } from 'servie'
```

#### Options

```ts
const request = new Request({
  url: '/',
  method: 'GET'
})
```

> Extends `Servie` options.

* `url` The HTTP request url (`string`)
* `method?` The HTTP request method (`string`, default: `GET`)
* `connection?` Connection information (`{ remoteAddress?: string, remotePort?: number, localAddress?: string, localPort?: number, encrypted?: boolean }`)

#### Properties

* `url` Requested url (`string`)
* `method` Requested method (`string`)
* `Url` Request url parsed into individual parts (`object`)
* `connection` HTTP connection information when available (`object`)

#### Methods

* `abort(): boolean` Aborts the HTTP connection

#### Events

* `abort` Request aborted and transport _MUST_ handle
* `error` An out-of-band error occurred and transport _MUST_ handle
* `response` The corresponding `Response` has started
* `connection` Emitted when connection information becomes available

### `Response`

> HTTP class for encapsulating a `Response`, extends `Servie`.

```ts
import { Response } from 'servie'
```

#### Options

```ts
const response = new Response({})
```

> Extends `Servie` options.

* `statusCode?` The HTTP response status code (`number`)
* `statusMessage?` The HTTP response status message (`string`)

#### Properties

* `statusCode` The HTTP response status code (`number`)
* `statusMessage?` The HTTP response status message (`string`)
* `ok` Returns whether response was successful (status in range 200-299) (`boolean`)

### `Headers`

> Used by `Servie` for `Request`, `Response` and `Body` objects.

```ts
import { Headers, createHeaders } from 'servie'
```

#### Options

```ts
const headers = createHeaders(...) // new Headers([...])
```

Create `Headers` instance from raw value (e.g. `HeadersObject | string[] | null`).

#### Properties

* `rawHeaders` The raw HTTP headers list (`string[]`)

#### Methods

* `set(name: string, value: string | string[]): this` Set a HTTP header by overriding case-insensitive headers of the same name
* `append(name: string, value: string | string[]): this` Append a HTTP header
* `get(name: string): string | undefined` Retrieve a case-insensitive HTTP header
* `getAll(name: string): string[]` Retrieve a list of matching case-insensitive HTTP headers
* `has(name: string): boolean` Check if a case-insensitive header is already set
* `delete(name: string): this` Delete a case-insensitive header
* `asObject(toLower?: boolean): HeadersObject` Return the headers as a plain object
* `extend(obj: HeadersObject): this` Extends the current headers with an object
* `keys()` Iterable of the available header names
* `values()` Iterable of header values
* `entries()` Iterable of headers as `[key, value]`
* `clone()` Clones the `Headers` instance

#### Static Methods

* `is(obj: any): boolean` Checks if an object is `Headers`

### `Body`

> Immutable representation of the body used by `Request` and `Response`.

```ts
import { Body, createBody } from 'servie/dist/body/{node,browser,universal}'
```

> `Body` is a complex part of Servie due to support for browsers and node.js together. TypeScript is also [missing a good story](https://github.com/Microsoft/TypeScript/issues/7753) for universal modules with code paths offering different features (e.g. streams in node.js, native `ReadableStream` in browsers), so it's required that you import a specific version for your environment.

**Note:** Each endpoint (`body/node`, `body/browser`, `body/universal`) offers the same basic API (`Body`, `createBody`). Universal relies on module bundlers (e.g. webpack) and [`package.json#browser`](package.json) to switch the node.js API with the browser API at bundle time. TypeScript _will_ require `dom` types since the interface returns a union of possible bodies (`node` and `browser`).

#### Options

```ts
const body = createBody(...) // new Body({ rawBody: ... })
```

Create a `Body` instance from raw data (e.g. `Readable | ReadableStream | Buffer | ArrayBuffer | object | string | null`).

#### Properties

* `buffered` Indicates the raw body is entirely in memory (`boolean`)
* `bodyUsed` Indicates the body has been read (`boolean`)
* `hasBody` Indicates the body is not empty (`boolean`)
* `headers` Instance of body-related HTTP headers (`Headers`)

#### Methods

* `text(): Promise<string>` Returns body as a UTF-8 string
* `json(): Promise<any>` Returns body parsed as JSON
* `arrayBuffer(): Promise<ArrayBuffer>` Returns the body as an `ArrayBuffer` instance
* `buffer(): Promise<Buffer>` Returns the body as a `Buffer` instance (node.js)
* `stream(): Readable` Returns a readable node.js stream (node.js)
* `readableStream(): ReadableStream` Returns a readable WHATWG stream (browsers)
* `clone(): this` Clones the `Body` instance (allowing body re-use, throws `TypeError` when `bodyUsed == true`)

#### Static Methods

* `is(obj: any): boolean` Checks if an object is `Body`

## Implementers

If you're building the transports for Servie, there are some life cycle events you need to be aware of and emit yourself:

1. Listen to the `error` event on `Request` for out-of-band errors and respond accordingly (e.g. application logging)
2. Listen to the `abort` event on `Request` and destroy the HTTP request/response
3. Resolve and send `trailers` with HTTP request
4. Emit `response` event on `Request` when response becomes available
5. Set `started === true` and `finished === true` on `Request` and `Response` (as appropriate)
6. Set `bytesTransferred` on `Request` and `Response` when monitoring HTTP transfer progress

## JavaScript

This module is designed for ES2015 environments and published with [TypeScript](https://github.com/Microsoft/TypeScript) definitions on NPM.

## License

Apache 2.0
