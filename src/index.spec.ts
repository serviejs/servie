import { Common, Request, Response } from './index'

describe('servie', () => {
  describe('common', () => {
    it('should accept headers', () => {
      const common = new Common({ headers: { 'X-Test': 'test' } })

      expect(common.headers.get('X-Test')).toBe('test')
      expect(common.headers.getAll('x-test')).toEqual(['test'])
      expect(common.headers.raw).toEqual(['X-Test', 'test'])
      expect(common.headers.object()).toEqual({ 'x-test': 'test' })
      expect(common.headers.object(true)).toEqual({ 'X-Test': 'test' })
    })
  })

  describe('request', () => {
    it('should have a url', () => {
      const req = new Request({ url: '/test' })

      expect(req.url).toBe('/test')
      expect(req.Url.pathname).toBe('/test')
    })
  })

  describe('response', () => {
    it('should have a status', () => {
      const res = new Response({ status: 200 })

      expect(res.status).toBe(200)
    })

    it('should json encode body if a simple object', () => {
      const res = new Response({ body: { foo: 'bar' } })

      expect(res.headers.get('Content-Type')).toBe('application/json')
      expect(res.body).toEqual('{\"foo\":\"bar\"}')
    })
  })

  describe('cloning', () => {
    it('should be possible to clone the request and response', () => {
      const req = new Request({ url: '/endpoint' })
      const res = new Response({ status: 404 })

      const reqClone = new Request(req)
      const resClone = new Response(res)

      expect(req).not.toBe(reqClone)
      expect(res).not.toBe(resClone)

      expect(req.url).toEqual('/endpoint')
      expect(req.url).toEqual(reqClone.url)
      expect(res.status).toEqual(404)
      expect(res.status).toEqual(resClone.status)
    })
  })
})
