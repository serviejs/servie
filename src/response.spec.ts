import { Response } from './response'

describe('servie request', () => {
  it('should support a status and status text', () => {
    const res = new Response({ status: 200, statusText: 'Awesome job!' })

    expect(res.status).toBe(200)
    expect(res.statusText).toBe('Awesome job!')
  })

  it('should be able to clone', () => {
    const res = new Response({ status: 201 })
    const resClone = new Response(res)

    expect(res).not.toBe(resClone)
    expect(res).toEqual(resClone)
  })
})
