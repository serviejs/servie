import { Readable } from 'stream'
import { NodeBody } from './base'

export class TextBody extends NodeBody<string> {

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

}
