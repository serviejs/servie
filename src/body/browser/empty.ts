import { Body } from './base'

export class EmptyBody extends Body<undefined> {

  text () {
    return Promise.resolve('')
  }

  arrayBuffer () {
    return Promise.resolve(new ArrayBuffer(0))
  }

  readableStream (): ReadableStream {
    throw new TypeError('`EmptyBody#readableStream()` not implemented')
  }

}
