import { BrowserBody } from './base'

declare const TextDecoder: {
  new (encoding: string): { decode (view: DataView): string }
}

export class ArrayBufferBody extends BrowserBody<ArrayBuffer> {

  async text () {
    const rawBody = this.useRawBody()
    const view = new DataView(rawBody)
    const decoder = new TextDecoder('utf-8')
    return decoder.decode(view)
  }

  async arrayBuffer () {
    return this.useRawBody()
  }

  readableStream (): ReadableStream {
    throw new TypeError('`ArrayBufferBody#readableStream()` not implemented')
  }

}
