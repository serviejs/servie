import { Readable } from 'stream'
import { NodeBody } from './base'

export class EmptyBody extends NodeBody<undefined> {

  async text () {
    this.useRawBody()
    return ''
  }

  async json () {
    this.useRawBody()
    return null
  }

  async buffer () {
    this.useRawBody()
    return Buffer.alloc(0)
  }

  stream () {
    this.useRawBody()
    return new Readable({ read () { this.push(null) } })
  }

}
