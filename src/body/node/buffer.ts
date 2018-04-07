import { Readable } from 'stream'
import { NodeBody } from './base'

export class BufferBody extends NodeBody<Buffer> {

  async text () {
    const buffer = this.useRawBody()
    return buffer.toString('utf8')
  }

  async buffer () {
    return this.useRawBody()
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

}
