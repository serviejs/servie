import { Readable } from 'stream'
import { Body } from './base'

export class BufferBody extends Body<Buffer> {

  text () {
    return Promise.resolve(this.useRawBody().toString('utf8'))
  }

  buffer () {
    return Promise.resolve(this.useRawBody())
  }

  stream () {
    let o: Buffer | null = this.useRawBody()

    return new Readable({
      read () {
        this.push(o)
        o = null
      }
    })
  }

  clone () {
    return new BufferBody({
      rawBody: this.rawBody.slice(0),
      headers: this.headers.clone()
    })
  }

}
