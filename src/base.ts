import { EventEmitter } from 'events'
import { Headers, createHeaders } from './headers'
import { BodyCommon as Body } from './body'
import { createBody } from './body/universal'

export interface ServieOptions {
  events?: EventEmitter
  headers?: Headers
  trailers?: Headers
  body?: Body
}

export class Servie implements ServieOptions {

  readonly events: EventEmitter
  protected _body!: Body
  protected _headers!: Headers
  protected _trailers!: Headers
  protected _bytesTransferred = 0

  constructor (options: ServieOptions = {}) {
    this.events = options.events || new EventEmitter()
    this.headers = options.headers || createHeaders()
    this.trailers = options.trailers || createHeaders()
    this.body = options.body || createBody()
  }

  getHeaders () {
    const headers = this.headers.clone()
    for (const [key, value] of this.body.headers.entries()) {
      if (!headers.has(key)) headers.append(key, value)
    }
    return headers
  }

  get finished () {
    return false
  }

  set finished (value: boolean) {
    if (value) {
      Object.defineProperty(this, 'finished', { value })
      this.events.emit('finished')
    }
  }

  get started () {
    return false
  }

  set started (value: boolean) {
    if (value) {
      Object.defineProperty(this, 'started', { value })
      this.events.emit('started')
    }
  }

  get bytesTransferred () {
    return this._bytesTransferred
  }

  set bytesTransferred (bytes: number) {
    if (bytes > this._bytesTransferred) {
      this._bytesTransferred = bytes
      this.events.emit('progress', this)
    }
  }

  get headers () {
    return this._headers
  }

  set headers (headers: Headers) {
    this._headers = headers
    this.events.emit('headers', headers)
  }

  get trailers () {
    return this._trailers
  }

  set trailers (trailers: Headers) {
    this._trailers = trailers
    this.events.emit('trailers', trailers)
  }

  get body () {
    return this._body
  }

  set body (body: Body) {
    this._body = body
    this.events.emit('body', body)
  }

}
