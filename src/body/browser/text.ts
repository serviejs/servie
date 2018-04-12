import { Body } from './base'

declare const TextEncoder: {
  new (encoding: string): { encode (str: string): Uint8Array }
}

export class TextBody extends Body<string> {

  text () {
    return Promise.resolve(this.useRawBody())
  }

  arrayBuffer () {
    const rawBody = this.useRawBody()
    const encoder = new TextEncoder('utf-8')
    return Promise.resolve(encoder.encode(rawBody).buffer)
  }

  readableStream (): ReadableStream {
    throw new TypeError('`TextBody#readableStream()` not implemented')
  }

  clone () {
    return new TextBody({
      rawBody: this.rawBody,
      headers: this.headers.clone()
    })
  }

}
