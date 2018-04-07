import { Readable } from 'stream'
import { Body } from '../base'

export abstract class NodeBody <T = any> extends Body<T> {

  abstract buffer (): Promise<Buffer>

  abstract stream (): Readable

  async json () {
    return JSON.parse(await this.text())
  }

  arrayBuffer () {
    return this.buffer().then(x => x.buffer)
  }

}
