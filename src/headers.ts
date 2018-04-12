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

/**
 * Stricter object-style headers for working with node.js.
 */
export interface HeadersObject {
  [key: string]: string | string[]
}

export class Headers {

  rawHeaders: string[] = []
  headerNames: Set<string> = new Set()

  constructor (rawHeaders: string[] = []) {
    if (rawHeaders.length % 2 === 1) {
      throw new TypeError(`Expected headers length to be even, got ${rawHeaders.length}`)
    }

    for (let i = 0; i < rawHeaders.length; i += 2) {
      this.append(rawHeaders[i], rawHeaders[i + 1])
    }
  }

  static is (obj: any): obj is Headers {
    return typeof obj === 'object' && Array.isArray(obj.rawHeaders)
  }

  asObject (toLower = true) {
    const headers: HeadersObject = Object.create(null)

    for (let i = 0; i < this.rawHeaders.length; i += 2) {
      const key = toLower ? this.rawHeaders[i].toLowerCase() : this.rawHeaders[i]

      if (headers[key] === undefined) { // tslint:disable-line
        headers[key] = this.rawHeaders[i + 1]
      } else if (typeof headers[key] === 'string') {
        headers[key] = [headers[key] as string, this.rawHeaders[i + 1]]
      } else {
        (headers[key] as string[]).push(this.rawHeaders[i + 1])
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
    this.headerNames.add(name.toLowerCase())

    if (Array.isArray(value)) {
      for (const item of value) {
        this.rawHeaders.push(name, String(item))
      }
    } else {
      this.rawHeaders.push(name, String(value))
    }

    return this
  }

  get (name: string): string | undefined {
    const lowered = name.toLowerCase()

    if (this.headerNames.has(lowered)) {
      for (let i = 0; i < this.rawHeaders.length; i += 2) {
        if (this.rawHeaders[i].toLowerCase() === lowered) {
          return this.rawHeaders[i + 1]
        }
      }
    }

    return undefined
  }

  getAll (name: string): string[] {
    const lowered = name.toLowerCase()
    const result: string[] = []

    if (this.headerNames.has(lowered)) {
      for (let i = 0; i < this.rawHeaders.length; i += 2) {
        if (this.rawHeaders[i].toLowerCase() === lowered) {
          result.push(this.rawHeaders[i + 1])
        }
      }
    }

    return result
  }

  has (name: string): boolean {
    return this.headerNames.has(name.toLowerCase())
  }

  delete (name: string) {
    const lowered = name.toLowerCase()

    if (this.headerNames.has(lowered)) {
      this.headerNames.delete(lowered)

      for (let i = 0; i < this.rawHeaders.length; i += 2) {
        if (this.rawHeaders[i].toLowerCase() === lowered) {
          this.rawHeaders.splice(i, 2)
        }
      }
    }

    return this
  }

  keys () {
    return this.headerNames.values()
  }

  * entries () {
    for (let i = 0; i < this.rawHeaders.length; i += 2) {
      yield [this.rawHeaders[i], this.rawHeaders[i + 1]]
    }
  }

  * values () {
    for (let i = 1; i < this.rawHeaders.length; i += 2) {
      yield this.rawHeaders[i]
    }
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
