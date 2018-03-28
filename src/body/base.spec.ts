import { BodyBase } from './base'

describe('body base', () => {
  it('should create a new body class', () => {
    const body = new BodyBase({ rawBody: '', buffered: true })

    expect(body.hasBody).toBe(true)
    expect(body.buffered).toBe(true)
  })

  it('should stringify objects as json', () => {
    const body = BodyBase.from({ test: true })

    expect(body.rawBody).toEqual('{"test":true}')
    expect(body.hasBody).toEqual(true)
    expect(body.bodyUsed).toEqual(false)
  })

  it('should read and discard raw body', async () => {
    expect.assertions(6)

    const body = BodyBase.from('test')

    expect(body.bodyUsed).toEqual(false)
    expect(body.rawBody).toEqual('test')
    await expect(body.text()).resolves.toEqual('test')

    expect(body.bodyUsed).toEqual(true)
    expect(body.rawBody).toEqual(undefined)
    await expect(body.text()).rejects.toEqual(new TypeError('Body already used'))
  })

  it('should clone from another body instance', () => {
    const body = BodyBase.from('test')
    const bodyClone = BodyBase.from(body)

    expect(body.bodyUsed).toEqual(true)
    expect(body.rawBody).toEqual(undefined)

    expect(bodyClone.bodyUsed).toEqual(false)
    expect(bodyClone.rawBody).toEqual('test')
  })
})
