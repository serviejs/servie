import { Request, Response } from './index'

describe('index', () => {
  it('is a universal endpoint', () => {
    const req = new Request('/');
    const res = new Response(null);

    expect(req).toBeInstanceOf(Request);
    expect(res).toBeInstanceOf(Response);
  })
})
