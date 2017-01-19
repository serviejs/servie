import { Common, Request, Response } from './index'

describe('httpco', () => {
  describe('common', () => {
    it('should accept headers', () => {
      const common = new Common({ headers: { 'X-Test': 'test' } })

      expect(common.headers.get('X-Test')).toBe('test')
      expect(common.headers.getAll('x-test')).toEqual(['test'])
      expect(common.headers.raw).toEqual(['X-Test', 'test'])
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
  })
})
