import { Readable } from 'stream'
import { BodyCommon } from '../common'

export abstract class Body <T = any> extends BodyCommon<T> {

  json () {
    return this.text().then(x => JSON.parse(x))
  }

  arrayBuffer () {
    return this.buffer().then(buffer => {
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    })
  }

  abstract buffer (): Promise<Buffer>

  abstract stream (): Readable

  abstract clone (): Body<T>

}
