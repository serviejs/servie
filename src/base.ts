import { EventEmitter } from 'events'
import { Headers, createHeaders } from './headers'
import { BodyCommon as Body } from './body'
import { createBody } from './body/universal'

export interface ServieOptions {
  events?: EventEmitter
  headers?: Headers
  body?: Body
  trailer?: Headers | Promise<Headers>
}

export const kBytesTransferred = Symbol('bytesTransferred')

export abstract class Servie implements ServieOptions {

  events: EventEmitter
  body: Body
  headers: Headers
  trailer: Promise<Headers>

  protected [kBytesTransferred] = 0

  constructor (options: ServieOptions = {}) {
    this.events = options.events || new EventEmitter()
    this.headers = options.headers || createHeaders()
    this.body = options.body || createBody()
    this.trailer = Promise.resolve(options.trailer || createHeaders())
  }

  get allHeaders () {
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

  get bytesTransferred () { return this[kBytesTransferred] }

  set bytesTransferred (bytes: number) {
    if (bytes > this[kBytesTransferred]) {
      this[kBytesTransferred] = bytes
      this.events.emit('progress', bytes)
    }
  }

  abstract clone (): Servie

}
