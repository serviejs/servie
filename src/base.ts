import { EventEmitter } from 'events'
import { Headers, createHeaders } from './headers'
import { BodyCommon as Body } from './body'
import { createBody } from './body/universal'

export interface ServieOptions {
  events?: EventEmitter
  headers?: Headers
  trailers?: Promise<Headers>
  body?: Body
}

export const kEvents = Symbol('events')
export const kBody = Symbol('body')
export const kHeaders = Symbol('headers')
export const kTrailers = Symbol('trailers')
export const kBytesTransferred = Symbol('bytesTransferred')

export abstract class Servie implements ServieOptions {

  events: EventEmitter

  protected [kBody]: Body
  protected [kHeaders]: Headers
  protected [kTrailers]: Promise<Headers> | undefined
  protected [kBytesTransferred] = 0

  constructor (options: ServieOptions = {}) {
    this.events = options.events || new EventEmitter()
    this[kHeaders] = options.headers || createHeaders()
    this[kTrailers] = options.trailers || Promise.resolve(createHeaders())
    this[kBody] = options.body || createBody()
  }

  getHeaders () {
    const headers = this.headers.clone()
    for (const [key, value] of this.body.headers.entries()) {
      if (!headers.has(key)) headers.append(key, value)
    }
    return headers
  }

  get finished () { return false }

  set finished (value: boolean) {
    if (value) {
      Object.defineProperty(this, 'finished', { value })
      this.events.emit('finished')
    }
  }

  get started () { return false }

  set started (value: boolean) {
    if (value) {
      Object.defineProperty(this, 'started', { value })
      this.events.emit('started')
    }
  }

  get bytesTransferred () {
    return this[kBytesTransferred]
  }

  set bytesTransferred (bytes: number) {
    if (bytes > this[kBytesTransferred]) {
      this[kBytesTransferred] = bytes
      this.events.emit('progress', this)
    }
  }

  get headers () {
    return this[kHeaders]
  }

  set headers (headers: Headers) {
    this[kHeaders] = headers
    this.events.emit('headers', headers)
  }

  get trailers () {
    return this[kTrailers] || (this[kTrailers] = Promise.resolve(createHeaders()))
  }

  set trailers (trailers: Promise<Headers>) {
    this[kTrailers] = trailers
    this.events.emit('trailers', trailers)
  }

  get body () {
    return this[kBody]
  }

  set body (body: Body) {
    this[kBody] = body
    this.events.emit('body', body)
  }

  abstract clone (): Servie

}
