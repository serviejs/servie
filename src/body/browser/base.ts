import { Body } from '../base'

export abstract class BrowserBody <T = any> extends Body<T> {

  abstract readableStream (): ReadableStream

  async json () {
    return JSON.parse(await this.text())
  }

}
