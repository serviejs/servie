export interface HeadersObject {
  [key: string]: number | string | (string | number)[]
}

export type HeadersFrom = Headers | HeadersObject | string[] | null | undefined

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

  static from (value: HeadersFrom) {
    if (Headers.is(value)) return new Headers(value.rawHeaders)
    if (Array.isArray(value)) return new Headers(value)
    if (value === undefined || value === null) return new Headers()

    return new Headers().extend(value)
  }

  asObject (toLower = false) {
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

  set (name: string, value: string | number | (string | number)[]): this {
    this.delete(name)
    this.append(name, value)
    return this
  }

  append (name: string, value: string | number | (string | number)[]): this {
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

  extend (obj: HeadersObject) {
    for (const key of Object.keys(obj)) this.append(key, obj[key])

    return this
  }

  toJSON (): object {
    return this.asObject()
  }

}
