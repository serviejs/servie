import { createBody } from './index'

describe('body', () => {
  it('should create a new body class', () => {
    const body = createBody('')

    expect(body.hasBody).toBe(true)
    expect(body.buffered).toBe(true)
  })

  it('should stringify objects as json', () => {
    const body = createBody({ test: true })

    expect(body.rawBody).toEqual('{"test":true}')
    expect(body.hasBody).toEqual(true)
    expect(body.bodyUsed).toEqual(false)
  })

  it('should read and discard raw body', async () => {
    expect.assertions(6)

    const body = createBody('test')

    expect(body.bodyUsed).toEqual(false)
    expect(body.rawBody).toEqual('test')
    await expect(body.text()).resolves.toEqual('test')

    expect(body.bodyUsed).toEqual(true)
    expect(() => body.rawBody).toThrow(TypeError)
    await expect(body.text()).rejects.toEqual(new TypeError('Body already used'))
  })

  it('should clone body instance', () => {
    const body = createBody('test')
    const bodyClone = createBody(body)

    expect(body.bodyUsed).toEqual(false)
    expect(body.rawBody).toEqual('test')
    expect(body.headers.get('content-length')).toEqual('4')

    expect(bodyClone.bodyUsed).toEqual(false)
    expect(bodyClone.rawBody).toEqual('test')
    expect(bodyClone.headers.get('content-length')).toEqual('4')
  })

  it('should create a body from buffer', async () => {
    const body = createBody(Buffer.from('test'))

    expect(body.hasBody).toBe(true)
    expect(body.buffered).toBe(true)
    expect(body.bodyUsed).toBe(false)
    expect(await body.text()).toEqual('test')
  })
})
