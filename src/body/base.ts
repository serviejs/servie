import { byteLength } from 'byte-length'

import { Headers } from '../headers'

export interface BodyBaseOptions <T> {
  rawBody?: T
  headers?: Headers
  buffered?: boolean
}

export type RawBodyBase = string
export type BodyBaseFrom = object | string | null | undefined

export class BodyBase<T = any> implements BodyBaseOptions<T> {

  readonly rawBody?: T
  readonly buffered!: boolean
  readonly bodyUsed!: boolean
  readonly hasBody!: boolean
  readonly headers!: Headers

  constructor (options: BodyBaseOptions<T> = {}) {
    Object.defineProperty(this, 'rawBody', {
      configurable: true,
      value: options.rawBody
    })

    Object.defineProperty(this, 'bodyUsed', {
      configurable: true,
      value: false
    })

    // These properties do not change after initialisation.
    Object.defineProperty(this, 'hasBody', { value: options.rawBody !== undefined })
    Object.defineProperty(this, 'headers', { value: options.headers || new Headers() })
    Object.defineProperty(this, 'buffered', { value: !!options.buffered })
  }

  static is (obj: any): obj is BodyBase {
    return typeof obj === 'object' &&
      typeof obj.useRawBody === 'function' &&
      typeof obj.bodyUsed === 'boolean'
  }

  static from (obj: BodyBaseFrom): BodyBase<any> {
    return new this(this.configure(obj))
  }

  static configure (obj: BodyBaseFrom): BodyBaseOptions<any> {
    if (obj === undefined) return {}

    if (BodyBase.is(obj)) {
      return {
        rawBody: obj.useRawBody(x => x),
        buffered: obj.buffered,
        headers: obj.headers
      }
    }

    if (typeof obj === 'string') {
      const headers = Headers.from({
        'Content-Type': 'text/plain',
        'Content-Length': byteLength(obj)
      })

      return { rawBody: obj, buffered: true, headers }
    }

    const str = JSON.stringify(obj)

    const headers = Headers.from({
      'Content-Type': 'application/json',
      'Content-Length': byteLength(str)
    })

    return { rawBody: str, buffered: true, headers }
  }

  useRawBody <U> (fn: (rawBody: T | undefined) => U): U {
    if (this.bodyUsed) throw new TypeError('Body already used')

    const result = fn(this.rawBody)
    Object.defineProperty(this, 'rawBody', { value: undefined })
    Object.defineProperty(this, 'bodyUsed', { value: true })
    return result
  }

  async text (): Promise<string> {
    return this.useRawBody(async rawBody => {
      if (rawBody === undefined) return ''
      if (typeof rawBody === 'string') return rawBody

      throw new TypeError('`Body#text()` not implemented')
    })
  }

  async json () {
    return JSON.parse(await this.text())
  }

  toJSON (): object {
    return {
      bodyUsed: this.bodyUsed,
      hasBody: this.hasBody,
      buffered: this.buffered,
      headers: this.headers.toJSON()
    }
  }

}
