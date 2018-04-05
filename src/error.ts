import { BaseError } from 'make-error-cause'

import { Request } from './request'
import { Response } from './response'
import { HeadersObject } from './headers'

/**
 * Standard error class for HTTP issues.
 */
export class HttpError extends BaseError {

  code: string
  status: number
  request: Request
  response?: Response
  headers?: HeadersObject
  name = 'HttpError'

  constructor (
    message: string,
    code: string,
    status: number,
    request: Request,
    response?: Response,
    cause?: Error,
    headers?: HeadersObject
  ) {
    super(message, cause)

    this.code = code
    this.status = status
    this.request = request
    this.response = response
    this.headers = headers
  }

}
