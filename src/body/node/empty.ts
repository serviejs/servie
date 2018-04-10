import { Readable } from 'stream'
import { Body } from './base'

export class EmptyBody extends Body<undefined> {

  text () {
    this.useRawBody()
    return Promise.resolve('')
  }

  json () {
    this.useRawBody()
    return Promise.resolve(null)
  }

  buffer () {
    this.useRawBody()
    return Promise.resolve(Buffer.alloc(0))
  }

  stream () {
    this.useRawBody()
    return new Readable({ read () { this.push(null) } })
  }

}
