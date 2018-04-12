import { Headers } from '../headers'

export interface BodyCommonOptions <T> {
  rawBody: T
  headers?: Headers
  bodyUsed?: boolean
}

export const kRawBody = Symbol('rawBody')
export const kBodyUsed = Symbol('bodyUsed')

export abstract class BodyCommon <T = any> implements BodyCommonOptions<T> {

  [kRawBody]: T | undefined
  [kBodyUsed]: boolean = false

  readonly headers: Headers
  readonly hasBody: boolean = true
  readonly buffered: boolean = true

  constructor (options: BodyCommonOptions<T>) {
    this[kRawBody] = options.rawBody
    this.headers = options.headers || new Headers()
  }

  static is (obj: any): obj is BodyCommon<any> {
    return typeof obj === 'object' &&
      typeof obj.useRawBody === 'function' &&
      typeof obj.bodyUsed === 'boolean'
  }

  get rawBody (): T {
    if (this[kBodyUsed]) throw new TypeError('Body already used')

    return this[kRawBody]!
  }

  get bodyUsed () {
    return this[kBodyUsed]
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
