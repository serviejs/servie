import { Servie } from './base'
import { Headers, createHeaders } from './headers'
import { Body, createBody } from './body/universal'

describe('servie base', () => {
  it('should contain base properties', () => {
    const base = new Servie()

    expect(base.headers).toBeInstanceOf(Headers)
    expect(base.trailers).toBeInstanceOf(Headers)
    expect(base.body).toBeInstanceOf(Body)

    expect(base.body.hasBody).toBe(false)
  })

  it('should use instances of headers and body', () => {
    const body = createBody()
    const headers = new Headers()
    const base = new Servie({ headers, body })

    expect(base.headers).toBe(headers)
    expect(base.body).toBe(body)
  })

  it('should combine body headers and base headers', () => {
    const body = createBody({ json: true })
    const headers = createHeaders(['X-Powered-By', 'Servie'])
    const base = new Servie({ headers, body })

    expect(Array.from(base.getHeaders().entries())).toEqual([
      ['X-Powered-By', 'Servie'],
      ['Content-Type', 'application/json'],
      ['Content-Length', '13']
    ])
  })
})
