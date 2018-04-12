import { Request } from './request'
import { createBody, Body } from './body/node'
import { createHeaders, Headers } from './headers'

describe('servie request', () => {
  it('should contain base properties', () => {
    const req = new Request({ url: '/test' })

    expect(req.url).toBe('/test')
    expect(req.headers).toBeInstanceOf(Headers)
    expect(req.trailers).toBeInstanceOf(Headers)
    expect(req.body).toBeInstanceOf(Body)

    expect(req.Url.pathname).toBe('/test')
    expect(req.body.hasBody).toBe(false)
  })

  it('should use instances of headers and body', () => {
    const body = createBody()
    const headers = new Headers()
    const req = new Request({ url: '/', headers, body })

    expect(req.headers).toBe(headers)
    expect(req.body).toBe(body)
  })

  it('should combine body headers and request headers', () => {
    const body = createBody({ json: true })
    const headers = createHeaders(['X-Powered-By', 'Servie'])
    const req = new Request({ url: '/', headers, body })

    expect(Array.from(req.getHeaders().entries())).toEqual([
      ['X-Powered-By', 'Servie'],
      ['Content-Type', 'application/json'],
      ['Content-Length', '13']
    ])
  })

  it('should be able to clone', () => {
    const req = new Request({ url: '/endpoint' })
    const reqClone = new Request(req)

    expect(req).not.toBe(reqClone)
    expect(req).toEqual(reqClone)
  })

  it('should infer the correct body type', async () => {
    const req = new Request({ url: '/', body: createBody('test') })

    if (req.body instanceof Body) {
      expect(await req.body.buffer()).toEqual(Buffer.from('test'))
    }
  })
})
