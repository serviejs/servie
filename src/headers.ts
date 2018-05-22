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
 * @internal
 */
export const kHeaderList = Symbol('headerList')

/**
 * @internal
 */
export const kHeaderNames = Symbol('headerNames')

/**
 * Stricter object-style headers for working with node.js.
 */
export interface HeadersObject {
  [key: string]: string | string[]
}

export class Headers {

  protected [kHeaderList]: string[]
  protected [kHeaderNames]: Set<string>

  constructor (rawHeaders: string[] = []) {
    if (rawHeaders.length % 2 === 1) {
      throw new TypeError(`Expected headers length to be even, got ${rawHeaders.length}`)
    }

    this[kHeaderList] = []
    this[kHeaderNames] = new Set()

    for (let i = 0; i < rawHeaders.length; i += 2) {
      this.append(rawHeaders[i], rawHeaders[i + 1])
    }
  }

  static is (obj: any): obj is Headers {
    return typeof obj === 'object' && Array.isArray(obj.rawHeaders)
  }

  get rawHeaders () { return this[kHeaderList] }

  asObject (toLower = true) {
    const headers: HeadersObject = Object.create(null)
    const rawHeaders = this[kHeaderList]

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
        this[kHeaderList].push(name, String(item))
      }
    } else {
      this[kHeaderList].push(name, String(value))
    }

    return this
  }

  get (name: string): string | undefined {
    const key = name.toLowerCase()

    if (this[kHeaderNames].has(key)) {
      const headerList = this[kHeaderList]

      for (let i = 0; i < headerList.length; i += 2) {
        if (headerList[i].toLowerCase() === key) {
          return headerList[i + 1]
        }
      }
    }

    return undefined
  }

  getAll (name: string): string[] {
    const key = name.toLowerCase()
    const result: string[] = []

    if (this[kHeaderNames].has(key)) {
      const headerList = this[kHeaderList]

      for (let i = 0; i < headerList.length; i += 2) {
        if (headerList[i].toLowerCase() === key) {
          result.push(headerList[i + 1])
        }
      }
    }

    return result
  }

  has (name: string): boolean {
    const key = name.toLowerCase()
    return this[kHeaderNames].has(key)
  }

  delete (name: string) {
    const key = name.toLowerCase()

    if (this[kHeaderNames].has(key)) {
      const headerList = this[kHeaderList]

      for (let i = 0; i < headerList.length; i += 2) {
        if (headerList[i].toLowerCase() === key) {
          headerList.splice(i, 2)
        }
      }

      this[kHeaderNames].delete(key)
    }

    return this
  }

  * entries (): IterableIterator<[string, string]> {
    const headerList = this[kHeaderList]

    for (let i = 0; i < headerList.length; i += 2) {
      yield [headerList[i], headerList[i + 1]]
    }
  }

  * keys (): IterableIterator<string> {
    const headerList = this[kHeaderList]

    for (let i = 0; i < headerList.length; i += 2) yield headerList[i]
  }

  * values (): IterableIterator<string> {
    const headerList = this[kHeaderList]

    for (let i = 1; i < headerList.length; i += 2) yield headerList[i]
  }

  clear () {
    this[kHeaderList].length = 0
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
