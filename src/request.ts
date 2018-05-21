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

export const kUrl = Symbol('url')
export const kUrlObject = Symbol('urlObject')

/**
 * The HTTP request class.
 */
export class Request extends Servie implements RequestOptions {

  method: string

  protected [kUrl]: string
  protected [kUrlObject]?: Url

  constructor (options: RequestOptions) {
    super(options)

    this[kUrl] = options.url
    this.method = options.method || 'GET'
    this.connection = options.connection
  }

  get url () {
    return this[kUrl]
  }

  set url (url: string) {
    this[kUrl] = url
    this[kUrlObject] = undefined
  }

  get Url () {
    return this[kUrlObject] || (this[kUrlObject] = parse(this.url, false, true))
  }

  get connection (): Connection | undefined {
    return undefined
  }

  set connection (value: Connection | undefined) {
    if (value) {
      Object.defineProperty(this, 'connection', { value })
      this.events.emit('connection')
    }
  }

  toJSON () {
    return {
      url: this.url,
      method: this.method,
      body: this.body.toJSON(),
      headers: this.headers.toJSON(),
      connection: this.connection,
      started: this.started,
      finished: this.finished,
      bytesTransferred: this.bytesTransferred
    }
  }

  clone () {
    if (this.started) throw new TypeError('Request already started')

    return new Request({
      url: this.url,
      method: this.method,
      connection: this.connection,
      events: this.events,
      body: this.body.clone(),
      headers: this.headers.clone(),
      trailer: this.trailer.then(x => x.clone())
    })
  }

}
