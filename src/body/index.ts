import { Readable } from 'stream'

import { BodyBase, BodyBaseOptions } from './base'
import { Headers } from '../headers'

export type RawBody = Buffer | Readable | string
export type BodyFrom = Body | RawBody | object | null | undefined

function isStream (stream: any): stream is Readable {
  return stream !== null && typeof stream === 'object' && typeof stream.pipe === 'function'
}

export interface BodyOptions <T> extends BodyBaseOptions<T> {}

export class Body extends BodyBase<RawBody> {

  static from (obj: any): Body {
    return new this(this.configure(obj))
  }

  static configure (obj: any): BodyOptions<RawBody> {
    if (Buffer.isBuffer(obj)) {
      const headers = Headers.from([
        'Content-Type',
        'application/octet-stream',
        'Content-Length',
        String(obj.length)
      ])

      return { rawBody: obj, headers, buffered: true }
    }

    if (isStream(obj)) {
      const headers = Headers.from(['Content-Type', 'application/octet-stream'])

      if (typeof (obj as any).getHeaders === 'function') {
        headers.extend((obj as any).getHeaders())
      }

      return { rawBody: obj, buffered: false, headers }
    }

    return super.configure(obj)
  }

  async buffer (maxBufferSize: number = 1000 * 1000): Promise<Buffer> {
    return this.useRawBody(rawBody => {
      if (rawBody === undefined) return Buffer.alloc(0)
      if (Buffer.isBuffer(rawBody)) return rawBody
      if (typeof rawBody === 'string') return Buffer.from(rawBody)

      const buf: Buffer[] = []
      let length = 0

      return new Promise<Buffer>((resolve, reject) => {
        rawBody.on('error', reject)

        rawBody.on('data', (chunk: Buffer) => {
          if (length > maxBufferSize) return

          length += chunk.length

          if (length <= maxBufferSize) {
            buf.push(chunk)
          }
        })

        rawBody.on('end', () => {
          if (length > maxBufferSize) {
            return reject(new TypeError('Exceeded max buffer size'))
          }

          return resolve(Buffer.concat(buf))
        })
      })
    })
  }

  stream (): Readable {
    return this.useRawBody(rawBody => {
      if (rawBody === undefined) return new Readable({ read () { this.push(null) } })
      if (isStream(rawBody)) return rawBody

      let o: Buffer | string | null = rawBody

      return new Readable({
        read () {
          this.push(o)
          o = null
        }
      })
    })
  }

  text (maxBufferSize?: number): Promise<string> {
    return this.useRawBody(async rawBody => {
      if (rawBody === undefined) return ''
      if (typeof rawBody === 'string') return rawBody

      const buffer = await this.buffer(maxBufferSize)
      return buffer.toString('utf8')
    })
  }

}
