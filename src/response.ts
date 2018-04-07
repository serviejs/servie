import { Servie, ServieOptions } from './base'

/**
 * HTTP response class options.
 */
export interface ResponseOptions extends ServieOptions {
  statusCode?: number
  statusMessage?: string
}

/**
 * The HTTP response class.
 */
export class Response extends Servie implements ResponseOptions {

  statusCode: number
  statusMessage?: string

  get ok () {
    return this.statusCode >= 200 && this.statusCode < 300
  }

  constructor (options: ResponseOptions) {
    super(options)

    this.statusCode = typeof options.statusCode === 'number' ? options.statusCode : 200
    this.statusMessage = options.statusMessage
  }

  toJSON () {
    return {
      statusCode: this.statusCode,
      statusMessage: this.statusMessage,
      body: this.body.toJSON(),
      headers: this.headers.toJSON(),
      trailers: this.trailers.toJSON(),
      started: this.started,
      finished: this.finished,
      bytesTransferred: this.bytesTransferred
    }
  }
}
