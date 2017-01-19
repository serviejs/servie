import { Readable } from 'stream'
import { parse, format, Url } from 'url'
import { EventEmitter } from 'events'
import { BaseError } from 'make-error-cause'

/**
 * Headers stored in a continuous array.
 */
export type RawHeaders = string[]

/**
 * Valid body payloads.
 */
export type Body = undefined | string | Buffer | Readable | {}

/**
 * Base request/response options.
 */
export interface CommonOptions {
  headers?: Headers | HeadersObject | RawHeaders | null
  trailers?: Headers | HeadersObject | RawHeaders | null
  events?: EventEmitter
  body?: Body
}

/**
 * Quick splice.
 */
function splice (arr: any[], start: number, count: number) {
  for (let i = start; i < arr.length - count; i++) {
    arr[i] = arr[i + count]
  }

  arr.length -= count
}

/**
 * Consistently lower case a header name.
 */
function lowerHeader (key: string) {
  const lower = key.toLowerCase()

  if (lower === 'referrer') {
    return 'referer'
  }

  return lower
}

/**
 * Concat two header values together.
 */
function join (a: string | string[], b: string): string | string[] {
  if (a == null) {
    return b
  }

  return Array.isArray(a) ? a.concat(b) : [a, b]
}

/**
 * Extract the content type from a header string.
 */
function type (str: string) {
  const index = str.indexOf(';')

  return index === -1 ? undefined : str.slice(0, index).trim()
}

/**
 * Create a `HttpError` instance.
 */
export default class HttpError extends BaseError {

  code: string
  status: number
  request: Request
  name = 'HttpError'

  constructor (message: string, code: string, status: number, request: Request, original?: Error) {
    super(message, original)

    this.code = code
    this.status = status
    this.request = request
  }

}

/**
 * Raw headers object.
 */
export interface HeadersObject {
  [key: string]: string | string[]
}

/**
 * Header container class.
 */
export class Headers {
  raw: string[] = []

  constructor (headers: Headers | HeadersObject | string[] | null | undefined) {
    if (headers instanceof Headers) {
      this.raw = headers.raw
    } else if (Array.isArray(headers)) {
      if (headers.length % 2 === 1) {
        throw new TypeError(`Expected raw headers length to be even, got ${headers.length}`)
      }

      this.raw = headers.slice(0)
    } else if (headers) {
      this.object(headers)
    }
  }

  object (): HeadersObject
  object (obj: HeadersObject | null): void
  object (obj?: HeadersObject | null): HeadersObject | void {
    if (arguments.length) {
      splice(this.raw, 0, this.raw.length)

      if (obj) {
        for (const key of Object.keys(obj)) {
          this.append(key, obj[key])
        }
      }

      return
    }

    const headers: HeadersObject = Object.create(null)

    for (let i = 0; i < this.raw.length; i += 2) {
      const key = lowerHeader(this.raw[i])
      const value = join(headers[key], this.raw[i + 1])
      headers[key] = value
    }

    return headers
  }

  set (name: string, value?: string | number | string[]): this {
    this.delete(name)
    this.append(name, value)

    return this
  }

  append (name: string, value?: string | number | string[]) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item != null) {
          this.raw.push(name, item)
        }
      }
    } else if (value != null) {
      this.raw.push(name, String(value))
    }

    return this
  }

  get (name: string): string | undefined {
    const lowered = lowerHeader(name)

    for (let i = 0; i < this.raw.length; i += 2) {
      if (lowerHeader(this.raw[i]) === lowered) {
        return this.raw[i + 1]
      }
    }

    return undefined
  }

  getAll (name: string): string[] {
    const lowered = lowerHeader(name)
    const result: string[] = []

    for (let i = 0; i < this.raw.length; i += 2) {
      if (lowerHeader(this.raw[i]) === lowered) {
        result.push(this.raw[i + 1])
      }
    }

    return result
  }

  has (name: string): boolean {
    const lowered = lowerHeader(name)

    for (let i = 0; i < this.raw.length; i += 2) {
      if (lowerHeader(this.raw[i]) === lowered) {
        return true
      }
    }

    return false
  }

  delete (name: string) {
    const lowered = lowerHeader(name)

    for (let i = 0; i < this.raw.length; i += 2) {
      if (lowerHeader(this.raw[i]) === lowered) {
        splice(this.raw, i, 2)
      }
    }

    return this
  }
}

/**
 * Create a base class for requests and responses.
 */
export class Common {
  events: EventEmitter

  private _body: Body
  private _bodyUsed = true
  private _headers: Headers
  private _trailers: Headers

  constructor ({ trailers, headers, events, body }: CommonOptions) {
    this.events = events || new EventEmitter()

    this.headers = new Headers(headers)
    this.trailers = new Headers(trailers)
    this.body = body
  }

  get headers () {
    return this._headers
  }

  set headers (headers: Headers) {
    this._headers = headers
    this.events.emit('headers', this._headers)
  }

  get trailers () {
    return this._trailers
  }

  set trailers (trailers: Headers) {
    this._trailers = trailers
    this.events.emit('trailers', this._trailers)
  }

  get body () {
    return this._body
  }

  set body (body: Body) {
    this._body = body
    this._bodyUsed = false

    if (body == null) {
      this.headers.delete('Content-Type')
      this.headers.delete('Content-Length')
      this.headers.delete('Content-Encoding')
      return
    }

    const setType = !this.headers.has('Content-Type')

    if (typeof body === 'string') {
      if (setType) {
        this.type = 'text/html'
      }

      this.length = Buffer.byteLength(body)
      return
    }

    if (Buffer.isBuffer(body)) {
      if (setType) {
        this.type = 'application/octet-stream'
      }

      this.length = body.length
      return
    }

    if (isStream(body)) {
      if (setType) {
        this.type = 'application/octet-stream'
      }

      this.length = undefined
      return
    }

    if (isBasicObject(body)) {
      this.type = 'application/json'
      this.length = undefined
    }

    throw new TypeError(`Unknown body: ${body}`)
  }

  get bodyUsed () {
    return this._bodyUsed
  }

  get type () {
    const header = this.headers.get('Content-Type')

    return header == null ? undefined : type(header)
  }

  set type (type: string | undefined) {
    this.headers.set('Content-Type', type)
  }

  get length () {
    const len = this.headers.get('Content-Length')

    return len == null ? undefined : Number(len)
  }

  set length (length: number | undefined) {
    this.headers.set('Content-Length', length)
  }

  buffer (maxBufferLength: number = 1000 * 1000): Promise<Buffer | undefined> {
    if (this.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }

    let body: Promise<Buffer | undefined>

    if (this._body == null) {
      body = Promise.resolve(undefined)
    } else if (Buffer.isBuffer(this._body)) {
      body = Promise.resolve(this._body)
    } else if (typeof this._body === 'string') {
      body = Promise.resolve(new Buffer(this._body))
    } else if (isStream(this._body)) {
      const stream = this._body
      const buf: Buffer[] = []
      let length = 0

      body = new Promise<Buffer>((resolve, reject) => {
        stream.on('error', reject)

        stream.on('data', (chunk: Buffer) => {
          if (length > maxBufferLength) {
            return
          }

          length += chunk.length

          if (length <= maxBufferLength) {
            buf.push(chunk)
          }
        })

        stream.on('end', () => {
          if (length > maxBufferLength) {
            return reject(new TypeError('Stream exceeded max buffer length'))
          }

          return resolve(Buffer.concat(buf))
        })
      })
    } else {
      body = Promise.resolve(new Buffer(JSON.stringify(this._body)))
    }

    this._body = undefined
    this._bodyUsed = true

    return body
  }

  stream (): Readable {
    if (this.bodyUsed) {
      throw new TypeError('Already read')
    }

    let body: Readable

    if (this._body == null) {
      body = new Readable({ read () { this.push(null) }})
    } else if (typeof this._body === 'string' || Buffer.isBuffer(this._body)) {
      let o: Buffer | string | null = this._body

      body = new Readable({
        read () {
          this.push(o)
          o = null
        }
      })
    } else if (isStream(this._body)) {
      body = this._body
    } else {
      let o: string | null = JSON.stringify(this._body)

      body = new Readable({
        read () {
          this.push(o)
          o = null
        }
      })
    }

    this._body = undefined
    this._bodyUsed = true

    return body
  }

  text (maxBufferLength?: number): Promise<string | undefined> {
    if (this.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }

    if (typeof this._body === 'string') {
      const body = this._body
      this._body = undefined
      this._bodyUsed = true
      return Promise.resolve(body)
    }

    return this.buffer(maxBufferLength).then(x => x ? x.toString('utf8') : undefined)
  }

  json (maxBufferLength?: number): Promise<{}> {
    if (isBasicObject(this._body)) {
      const body = this._body
      this._body = undefined
      this._bodyUsed = true
      return Promise.resolve(body)
    }

    return this.text(maxBufferLength).then(x => x ? JSON.parse(x) : undefined)
  }
}

/**
 * HTTP request class options.
 */
export interface RequestOptions extends CommonOptions {
  url: string
  method?: string
}

/**
 * The HTTP request class.
 */
export class Request extends Common {
  destroyed: HttpError

  private _Url: Url | undefined
  private _url: string | undefined
  private _method: string

  constructor (options: RequestOptions) {
    super(options)

    this.url = options.url
    this.method = options.method || 'GET'
  }

  get url () {
    return this._url || (this._url = format(this.Url))
  }

  set url (url: string) {
    this._url = url
    this._Url = undefined
  }

  get Url () {
    return this._Url || (this._Url = parse(this._url || '', false, true))
  }

  set Url (Url: Url) {
    this._Url = Url
    this._url = undefined
  }

  set method (method: string) {
    this._method = method.toUpperCase()
  }

  get method () {
    return this._method
  }

  error (message: string, code: string, status: number = 500, original?: Error): HttpError {
    return new HttpError(message, code, status, this, original)
  }

  destroy () {
    if (!this.destroyed) {
      this.destroyed = this.error('Request aborted', 'EDESTROY')
      this.events.emit('destroy', this.destroyed)
    }

    return this.destroyed
  }
}

/**
 * HTTP response class options.
 */
export interface ResponseOptions extends CommonOptions {
  status?: number
  statusText?: string
}

/**
 * The HTTP response class.
 */
export class Response extends Common {
  status: number
  statusText: string

  constructor (options: ResponseOptions) {
    super(options)

    if (options.status) {
      this.status = options.status
    }

    if (options.statusText) {
      this.statusText = options.statusText
    }
  }
}

/**
 * Check if a stream is readable.
 */
function isStream (stream: any): stream is Readable {
  return stream !== null &&
    typeof stream === 'object' &&
    typeof stream.pipe === 'function'
}

/**
 * Check if an object is plain.
 */
function isBasicObject (obj: any): obj is {} | any[] {
  if (typeof obj !== 'object') {
    return false
  }

  const proto = Object.getPrototypeOf(obj)

  return proto === null || proto === Object.prototype || proto === Array.prototype
}
