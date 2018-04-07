import { BrowserBody } from './base'
import { EmptyBody } from './empty'
import { TextBody } from './text'
import { ArrayBufferBody } from './array-buffer'
import { StreamBody } from './stream'
import { createHeaders } from '../../headers'

export { BrowserBody, EmptyBody, TextBody, ArrayBufferBody, StreamBody }

export type CreateBody = BrowserBody<any> | ReadableStream | ArrayBuffer | object | string | null

export function createBody (value?: CreateBody): BrowserBody<any> {
  if (value === undefined) return new EmptyBody({ rawBody: undefined })
  if (BrowserBody.is(value)) return value.clone()

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
      'Content-Length': Buffer.byteLength(value)
    })

    return new TextBody({ rawBody: value, headers })
  }

  const str = JSON.stringify(value)

  const headers = createHeaders({
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(str)
  })

  return new TextBody({ rawBody: str, headers })
}
