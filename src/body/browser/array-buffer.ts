import { Body } from './base'

declare const TextDecoder: {
  new (encoding: string): { decode (view: DataView): string }
}

export class ArrayBufferBody extends Body<ArrayBuffer> {

  text () {
    const rawBody = this.useRawBody()
    const view = new DataView(rawBody)
    const decoder = new TextDecoder('utf-8')
    return Promise.resolve(decoder.decode(view))
  }

  arrayBuffer () {
    return Promise.resolve(this.useRawBody())
  }

  readableStream (): ReadableStream {
    throw new TypeError('`ArrayBufferBody#readableStream()` not implemented')
  }

  clone () {
    return new ArrayBufferBody({
      rawBody: this.rawBody.slice(0),
      headers: this.headers.clone()
    })
  }

}
