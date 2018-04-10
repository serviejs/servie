import { Headers } from '../headers'

export interface BodyCommonOptions <T> {
  rawBody: T
  headers?: Headers
}

export abstract class BodyCommon <T = any> implements BodyCommonOptions<T> {

  readonly rawBody!: T
  readonly bodyUsed!: boolean
  readonly hasBody!: boolean
  readonly headers!: Headers

  readonly buffered: boolean = true

  constructor (options: BodyCommonOptions<T>) {
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
  }

  static is (obj: any): obj is BodyCommon<any> {
    return typeof obj === 'object' &&
      typeof obj.useRawBody === 'function' &&
      typeof obj.bodyUsed === 'boolean'
  }

  useRawBody () {
    if (this.bodyUsed) throw new TypeError('Body already used')

    const rawBody = this.rawBody
    Object.defineProperty(this, 'rawBody', { value: undefined })
    Object.defineProperty(this, 'bodyUsed', { value: true })
    return rawBody
  }

  clone (): this {
    const rawBody = this.useRawBody()
    const headers = this.headers

    return new (this as any).constructor({ rawBody, headers })
  }

  toJSON (): object {
    return {
      bodyUsed: this.bodyUsed,
      hasBody: this.hasBody,
      buffered: this.buffered,
      headers: this.headers.toJSON()
    }
  }

  abstract text (): Promise<string>

  abstract json (): Promise<any>

  abstract arrayBuffer (): Promise<ArrayBuffer>

}
