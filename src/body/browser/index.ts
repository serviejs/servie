import { byteLength } from 'byte-length'
import { Body } from './base'
import { EmptyBody } from './empty'
import { TextBody } from './text'
import { ArrayBufferBody } from './array-buffer'
import { StreamBody } from './stream'
import { createHeaders } from '../../headers'

export { Body, EmptyBody, TextBody, ArrayBufferBody, StreamBody }

export type CreateBody = Body<any> | ReadableStream | ArrayBuffer | object | string | null

export function createBody (value?: CreateBody): Body<any> {
  if (value === undefined) return new EmptyBody({ rawBody: undefined })
  if (Body.is(value)) return value.clone()

  if (value instanceof ArrayBuffer) {
    const headers = createHeaders({
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(value.byteLength)
    })

    return new ArrayBufferBody({ rawBody: value, headers })
  }

  if (value instanceof ReadableStream) {
    const headers = createHeaders(['Content-Type', 'application/octet-stream'])

    return new StreamBody({ rawBody: value, headers })
  }

  if (typeof value === 'string') {
    const headers = createHeaders({
      'Content-Type': 'text/plain',
      'Content-Length': byteLength(value)
    })

    return new TextBody({ rawBody: value, headers })
  }

  const str = JSON.stringify(value)

  const headers = createHeaders({
    'Content-Type': 'application/json',
    'Content-Length': byteLength(str)
  })

  return new TextBody({ rawBody: str, headers })
}