import { BodyCommon } from '../common'

export abstract class Body <T = any> extends BodyCommon<T> {

  abstract readableStream (): ReadableStream

  json () {
    return this.text().then(x => JSON.parse(x))
  }

}
