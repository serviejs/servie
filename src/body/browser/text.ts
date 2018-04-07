import { BrowserBody } from './base'

declare const TextEncoder: {
  new (encoding: string): { encode (str: string): Uint8Array }
}

export class TextBody extends BrowserBody<string> {

  async text () {
    return this.useRawBody()
  }

  async arrayBuffer () {
    const rawBody = this.useRawBody()
    const encoder = new TextEncoder('utf-8')
    return encoder.encode(rawBody).buffer
  }

  readableStream (): ReadableStream {
    throw new TypeError('`TextBody#readableStream()` not implemented')
  }

}
