import { Response } from './response'

describe('servie request', () => {
  it('should create 200 responses by default', () => {
    const res = new Response({ statusMessage: 'Awesome job!' })

    expect(res.statusCode).toBe(200)
    expect(res.ok).toBe(true)
    expect(res.statusMessage).toBe('Awesome job!')
  })

  it('should create custom status code responses', async () => {
    const res = new Response({ statusCode: 404 })

    expect(res.statusCode).toBe(404)
    expect(res.ok).toBe(false)
    expect(res.statusMessage).toBe(undefined)
    expect(await res.body.text()).toBe('')
  })

  it('should be able to clone', () => {
    const res = new Response({ statusCode: 201 })
    const resClone = new Response(res)

    expect(res).not.toBe(resClone)
    expect(res).toEqual(resClone)
  })
})
