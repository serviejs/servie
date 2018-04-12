import { Body } from './base'

export class EmptyBody extends Body<undefined> {

  readonly hasBody = false

  text () {
    return Promise.resolve('')
  }

  arrayBuffer () {
    return Promise.resolve(new ArrayBuffer(0))
  }

  readableStream (): ReadableStream {
    throw new TypeError('`EmptyBody#readableStream()` not implemented')
  }

  clone () {
    return new EmptyBody({
      rawBody: this.rawBody,
      headers: this.headers.clone()
    })
  }

}
