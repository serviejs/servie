/**
 * Valid header values for appending to map.
 */
export type HeaderValues = string | number | (string | number)[]

/**
 * Loose object-style header definition.
 */
export interface HeadersValuesObject {
  [key: string]: HeaderValues
}

export const kRawHeaders = Symbol('rawHeaders')
export const kHeaderNames = Symbol('headerNames')

/**
 * Stricter object-style headers for working with node.js.
 */
export interface HeadersObject {
  [key: string]: string | string[]
}

export class Headers {

  protected [kRawHeaders]: string[]
  protected [kHeaderNames]: Set<string>

  constructor (rawHeaders: string[] = []) {
    if (rawHeaders.length % 2 === 1) {
      throw new TypeError(`Expected headers length to be even, got ${rawHeaders.length}`)
    }

    this[kRawHeaders] = []
    this[kHeaderNames] = new Set()

    for (let i = 0; i < rawHeaders.length; i += 2) {
      this.append(rawHeaders[i], rawHeaders[i + 1])
    }
  }

  static is (obj: any): obj is Headers {
    return typeof obj === 'object' && Array.isArray(obj.rawHeaders)
  }

  get rawHeaders () {
    return this[kRawHeaders]
  }

  asObject (toLower = true) {
    const headers: HeadersObject = Object.create(null)
    const rawHeaders = this[kRawHeaders]

    for (let i = 0; i < rawHeaders.length; i += 2) {
      const key = toLower ? rawHeaders[i].toLowerCase() : rawHeaders[i]

      if (headers[key] === undefined) { // tslint:disable-line
        headers[key] = rawHeaders[i + 1]
      } else if (typeof headers[key] === 'string') {
        headers[key] = [headers[key] as string, rawHeaders[i + 1]]
      } else {
        (headers[key] as string[]).push(rawHeaders[i + 1])
      }
    }

    return headers
  }

  set (name: string, value: HeaderValues): this {
    this.delete(name)
    this.append(name, value)
    return this
  }

  append (name: string, value: HeaderValues): this {
    this[kHeaderNames].add(name.toLowerCase())

    if (Array.isArray(value)) {
      for (const item of value) {
        this[kRawHeaders].push(name, String(item))
      }
    } else {
      this[kRawHeaders].push(name, String(value))
    }

    return this
  }

  get (name: string): string | undefined {
    const lowered = name.toLowerCase()

    if (this[kHeaderNames].has(lowered)) {
      const rawHeaders = this[kRawHeaders]

      for (let i = 0; i < rawHeaders.length; i += 2) {
        if (rawHeaders[i].toLowerCase() === lowered) {
          return rawHeaders[i + 1]
        }
      }
    }

    return undefined
  }

  getAll (name: string): string[] {
    const lowered = name.toLowerCase()
    const result: string[] = []

    if (this[kHeaderNames].has(lowered)) {
      for (let i = 0; i < this.rawHeaders.length; i += 2) {
        if (this.rawHeaders[i].toLowerCase() === lowered) {
          result.push(this.rawHeaders[i + 1])
        }
      }
    }

    return result
  }

  has (name: string): boolean {
    return this[kHeaderNames].has(name.toLowerCase())
  }

  delete (name: string) {
    const lowered = name.toLowerCase()

    if (this[kHeaderNames].has(lowered)) {
      this[kHeaderNames].delete(lowered)

      for (let i = 0; i < this[kRawHeaders].length; i += 2) {
        if (this[kRawHeaders][i].toLowerCase() === lowered) {
          this[kRawHeaders].splice(i, 2)
        }
      }
    }

    return this
  }

  keys () {
    return this[kHeaderNames].values()
  }

  * entries () {
    const rawHeaders = this[kRawHeaders]

    for (let i = 0; i < rawHeaders.length; i += 2) {
      yield [rawHeaders[i], rawHeaders[i + 1]]
    }
  }

  * values () {
    const rawHeaders = this[kRawHeaders]

    for (let i = 1; i < rawHeaders.length; i += 2) {
      yield rawHeaders[i]
    }
  }

  clear () {
    this[kRawHeaders].splice(0, this[kRawHeaders].length)
    this[kHeaderNames].clear()
  }

  extend (obj: HeadersValuesObject) {
    for (const key of Object.keys(obj)) this.append(key, obj[key])

    return this
  }

  clone (): Headers {
    return new Headers(this.rawHeaders)
  }

  toJSON (): object {
    return this.asObject()
  }

}

export type CreateHeaders = Headers | HeadersValuesObject | string[] | null

/**
 * Create a `Headers` object from raw data.
 */
export function createHeaders (value?: CreateHeaders): Headers {
  if (value === undefined || value === null) return new Headers()
  if (Headers.is(value)) return new Headers(value.rawHeaders)
  if (Array.isArray(value)) return new Headers(value)

  return new Headers().extend(value)
}
