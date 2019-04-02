import { Body } from './base'
import { kRawBody } from '../common'

declare const TextDecoder: {
  new (encoding: string): { decode (view: DataView): string }
}

export class StreamBody extends Body<ReadableStream> {

  readonly buffered = false

  async arrayBuffer () {
    const stream = this.useRawBody()
    const reader = stream.getReader()
    let dataBuffer = new Uint8Array(0)

    while (true) {
      const result = await reader.read()
      const chunk: Uint8Array = result.value

      if (result.done) break

      const tmpBuffer = new Uint8Array(dataBuffer.byteLength + chunk.byteLength)
      tmpBuffer.set(dataBuffer, 0)
      tmpBuffer.set(chunk, dataBuffer.byteLength)
      dataBuffer = tmpBuffer
    }

    return dataBuffer.buffer
  }

  async text () {
    const buffer = await this.arrayBuffer()
    const view = new DataView(buffer)
    const decoder = new TextDecoder('utf-8')
    return decoder.decode(view)
  }

  readableStream () {
    return this.useRawBody()
  }

  clone () {
    // TODO(blakeembrey): Fix type when TypeScript has `ReadableStream`.
    const rawBody: any = this.rawBody
    const [thisRawBody, cloneRawBody] = rawBody.tee()

    this[kRawBody] = thisRawBody

    return new StreamBody({
      rawBody: cloneRawBody,
      headers: this.headers.clone()
    })
  }

}
