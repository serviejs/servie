import { Body } from './index'

describe('body', () => {
  it('should create a body from buffer', async () => {
    const body = Body.from(Buffer.from('test'))

    expect(body.hasBody).toBe(true)
    expect(body.buffered).toBe(true)
    expect(body.bodyUsed).toBe(false)
    expect(await body.text()).toEqual('test')
  })
})
