import { Readable } from 'stream'
import { byteLength } from 'byte-length'
import { Body } from './base'
import { EmptyBody } from './empty'
import { TextBody } from './text'
import { BufferBody } from './buffer'
import { StreamBody } from './stream'
import { createHeaders, HeadersValuesObject } from '../../headers'
import { CreateBodyOptions } from '../common'

export { Body, EmptyBody, TextBody, BufferBody, StreamBody }

export type CreateBody = Body<any> | Readable | Buffer | ArrayBuffer | object | string | null | undefined

function isStream (stream: any): stream is Readable & { getHeaders? (): HeadersValuesObject } {
  return stream !== null && typeof stream === 'object' && typeof stream.pipe === 'function'
}

export function createBody (value?: CreateBody, options: CreateBodyOptions = {}): Body<any> {
  if (value === undefined) return new EmptyBody({ rawBody: undefined })
  if (Body.is(value)) return value.clone()

  if (Buffer.isBuffer(value)) {
    const headers = createHeaders(options.headers || {
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(value.length)
    })

    return new BufferBody({ rawBody: value, headers })
  }

  if (value instanceof ArrayBuffer) {
    const headers = createHeaders(options.headers || {
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(value.byteLength)
    })

    return new BufferBody({ rawBody: Buffer.from(value), headers })
  }

  if (isStream(value)) {
    const headers = createHeaders(options.headers || {
      'Content-Type': 'application/octet-stream'
    })

    if (typeof value.getHeaders === 'function') headers.extend(value.getHeaders())

    return new StreamBody({ rawBody: value, headers })
  }

  if (typeof value === 'string') {
    const headers = createHeaders(options.headers || {
      'Content-Type': 'text/plain',
      'Content-Length': byteLength(value)
    })

    return new TextBody({ rawBody: value, headers })
  }

  const str = JSON.stringify(value)

  const headers = createHeaders(options.headers || {
    'Content-Type': 'application/json',
    'Content-Length': byteLength(str)
  })

  return new TextBody({ rawBody: str, headers })
}
