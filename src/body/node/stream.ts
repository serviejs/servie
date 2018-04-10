import { Readable } from 'stream'
import { Body } from './base'

export class StreamBody extends Body<Readable> {

  readonly buffered = false

  async text () {
    return this.buffer().then(x => x.toString('utf8'))
  }

  buffer (maxBufferSize: number = Infinity) {
    const buf: Buffer[] = []
    const rawBody = this.useRawBody()
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
  }

  stream () {
    return this.useRawBody()
  }

}