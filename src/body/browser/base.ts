import { BodyCommon } from '../common'

export abstract class Body <T = any> extends BodyCommon<T> {

  json () {
    return this.text().then(x => JSON.parse(x))
  }

  abstract readableStream (): ReadableStream

  abstract clone (): Body<T>

}
