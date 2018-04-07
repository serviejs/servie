import { BrowserBody } from './base'

export class EmptyBody extends BrowserBody<undefined> {

  async text () {
    return ''
  }

  async arrayBuffer () {
    return new ArrayBuffer(0)
  }

  readableStream (): ReadableStream {
    throw new TypeError('`EmptyBody#readableStream()` not implemented')
  }

}
