import { Request } from './request'

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
})
