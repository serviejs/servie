import { BrowserBody } from './base'

declare const TextDecoder: {
  new (encoding: string): { decode (view: DataView): string }
}

export class StreamBody extends BrowserBody<ReadableStream> {

  readonly buffered = false

  async text () {
    const buffer = await this.arrayBuffer()
    const view = new DataView(buffer)
    const decoder = new TextDecoder('utf-8')
    return decoder.decode(view)
  }

  async arrayBuffer () {
    const stream = this.useRawBody()
    const reader = stream.getReader()
    let dataBuffer = new Uint8Array(0)

    while (true) {
      const result = await reader.read()
      const chunk: Uint8Array = result.data

      if (result.done) break

      const tmpBuffer = new Uint8Array(dataBuffer.byteLength + chunk.byteLength)
      tmpBuffer.set(dataBuffer, 0)
      tmpBuffer.set(chunk, dataBuffer.byteLength)
      dataBuffer = tmpBuffer
    }

    return dataBuffer.buffer
  }

  readableStream () {
    return this.useRawBody()
  }

}
