import { BodyBase, BodyBaseOptions, RawBodyBase, BodyBaseFrom } from './base'
import { Headers } from '../headers'

declare const TextDecoder: {
  new (encoding: string): { decode (view: DataView): string }
}

declare const TextEncoder: {
  new (encoding: string): { encode (str: string): Uint8Array }
}

const hasArrayBuffer = typeof ArrayBuffer === 'function' // tslint:disable-line

export type RawBody = ArrayBuffer | RawBodyBase
export type BodyFrom = Body | RawBody | BodyBaseFrom

export interface BodyOptions <T> extends BodyBaseOptions<T> {}

export class Body extends BodyBase<RawBody> {

  static from (obj: any): Body {
    return new this(this.configure(obj))
  }

  static configure (obj: any): BodyOptions<RawBody> {
    if (hasArrayBuffer && obj instanceof ArrayBuffer) {
      const headers = Headers.from([
        'Content-Type',
        'application/octet-stream',
        'Content-Length',
        String(obj.byteLength)
      ])

      return { rawBody: obj, buffered: true, headers }
    }

    return super.configure(obj)
  }

  text (): Promise<string> {
    return this.useRawBody(async rawBody => {
      if (rawBody === undefined) return ''
      if (typeof rawBody === 'string') return rawBody

      const view = new DataView(rawBody)
      const decoder = new TextDecoder('utf-8')
      return decoder.decode(view)
    })
  }

  arrayBuffer (): Promise<ArrayBuffer> {
    return this.useRawBody(async rawBody => {
      if (!hasArrayBuffer) {
        throw new TypeError('`ArrayBuffer` not supported in current environment')
      }

      if (rawBody === undefined) return new ArrayBuffer(0)
      if (rawBody instanceof ArrayBuffer) return rawBody

      const encoder = new TextEncoder('utf-8')
      return encoder.encode(rawBody).buffer
    })
  }

}
