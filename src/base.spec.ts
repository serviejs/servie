import { ServieBase } from './base'
import { Headers } from './headers'
import { Body } from './body'

describe('servie base', () => {
  it('should contain base properties', () => {
    const base = new ServieBase()

    expect(base.headers).toBeInstanceOf(Headers)
    expect(base.trailers).toBeInstanceOf(Headers)
    expect(base.body).toBeInstanceOf(Body)

    expect(base.body.hasBody).toBe(false)
  })

  it('should use instances of headers and body', () => {
    const body = new Body()
    const headers = new Headers()
    const base = new ServieBase({ headers, body })

    expect(base.headers).toBe(headers)
    expect(base.body).toBe(body)
  })

  it('should combine body headers and base headers', () => {
    const body = Body.from({ json: true })
    const headers = Headers.from(['X-Powered-By', 'Servie'])
    const base = new ServieBase({ headers, body })

    expect(Array.from(base.getHeaders().entries())).toEqual([
      ['X-Powered-By', 'Servie'],
      ['Content-Type', 'application/json'],
      ['Content-Length', '13']
    ])
  })
})
