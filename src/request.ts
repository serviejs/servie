import { parse, Url } from 'url'
import { Servie, ServieOptions } from './base'

/**
 * HTTP request connection information.
 */
export interface Connection {
  remoteAddress?: string
  remotePort?: number
  localAddress?: string
  localPort?: number
  encrypted?: boolean
}

/**
 * HTTP request class options.
 */
export interface RequestOptions extends ServieOptions {
  url: string
  method?: string
  connection?: Connection
}

/**
 * The HTTP request class.
 */
export class Request extends Servie implements RequestOptions {

  _url: string
  _Url?: Url
  method: string

  constructor (options: RequestOptions) {
    super(options)

    this._url = options.url
    this.method = options.method || 'GET'
    this.connection = options.connection
  }

  get url () {
    return this._url
  }

  set url (url: string) {
    this._url = url
    this._Url = undefined
  }

  get Url () {
    return this._Url || (this._Url = parse(this._url, false, true))
  }

  get connection (): Connection | undefined {
    return undefined
  }

  set connection (value: Connection | undefined) {
    if (value) {
      Object.defineProperty(this, 'connection', { value })
      this.events.emit('connection', value)
    }
  }

  get aborted () {
    return false
  }

  set aborted (value: boolean) {
    if (value) {
      Object.defineProperty(this, 'aborted', { value })
      this.events.emit('aborted', value)
    }
  }

  abort () {
    const shouldAbort = !this.aborted && !this.finished

    if (shouldAbort) {
      this.aborted = true
      this.events.emit('abort')
    }

    return shouldAbort
  }

  toJSON () {
    return {
      url: this.url,
      method: this.method,
      body: this.body.toJSON(),
      headers: this.headers.toJSON(),
      trailers: this.trailers.toJSON(),
      started: this.started,
      finished: this.finished,
      bytesTransferred: this.bytesTransferred
    }
  }

}
