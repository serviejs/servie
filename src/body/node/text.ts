import { Readable } from 'stream'
import { Body } from './base'

export class TextBody extends Body<string> {

  async text () {
    return this.useRawBody()
  }

  async buffer () {
    return Buffer.from(this.useRawBody())
  }

  stream () {
    let o: string | null = this.useRawBody()

    return new Readable({
      read () {
        this.push(o)
        o = null
      }
    })
  }

  clone () {
    return new TextBody({
      rawBody: this.rawBody,
      headers: this.headers.clone()
    })
  }

}
