import { Request } from './request'
import { createBody, NodeBody } from './body/node'

describe('servie request', () => {
  it('should have a url', () => {
    const req = new Request({ url: '/test' })

    expect(req.url).toBe('/test')
    expect(req.Url.pathname).toBe('/test')
  })

  it('should be able to clone', () => {
    const req = new Request({ url: '/endpoint' })
    const reqClone = new Request(req)

    expect(req).not.toBe(reqClone)
    expect(req).toEqual(reqClone)
  })

  it('should infer the correct body type', async () => {
    const req = new Request({ url: '/', body: createBody('test') })

    if (req.body instanceof NodeBody) {
      expect(await req.body.buffer()).toEqual(Buffer.from('test'))
    }
  })
})
