import { Headers, CreateHeaders } from '../headers'

export interface CreateBodyOptions {
  headers?: CreateHeaders
}

export interface BodyCommonOptions <T> {
  rawBody: T
  headers?: Headers
  bodyUsed?: boolean
}

export const kRawBody = Symbol('rawBody')
export const kBodyUsed = Symbol('bodyUsed')

export abstract class BodyCommon <T = any> implements BodyCommonOptions<T> {

  readonly headers: Headers
  readonly hasBody: boolean = true
  readonly buffered: boolean = true

  protected [kRawBody]: T | undefined
  protected [kBodyUsed]: boolean = false

  constructor (options: BodyCommonOptions<T>) {
    this[kRawBody] = options.rawBody
    this.headers = options.headers || new Headers()
  }

  static is (obj: any): obj is BodyCommon<any> {
    return typeof obj === 'object' &&
      typeof obj.useRawBody === 'function' &&
      typeof obj.bodyUsed === 'boolean'
  }

  get bodyUsed () {
    return this[kBodyUsed]
  }

  get rawBody (): T {
    if (this[kBodyUsed]) throw new TypeError('Body already used')

    return this[kRawBody] as T
  }

  /**
   * Consumes and returns `this.rawBody`.
   */
  useRawBody () {
    const rawBody = this.rawBody
    this[kRawBody] = undefined
    this[kBodyUsed] = true
    return rawBody
  }

  toJSON () {
    return {
      bodyUsed: this.bodyUsed,
      hasBody: this.hasBody,
      buffered: this.buffered,
      headers: this.headers.toJSON()
    }
  }

  abstract arrayBuffer (): Promise<ArrayBuffer>

  abstract text (): Promise<string>

  abstract json (): Promise<any>

  abstract clone (): BodyCommon<T>

}
