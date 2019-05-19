export type HeadersObject = Record<string, string | string[] | undefined>;
export type HeaderTuple = [string, string | string[]];
export type HeadersInit = Iterable<HeaderTuple> | HeadersObject | Headers;

/**
 * Map of HTTP headers.
 */
export class Headers {
  object: Record<string, string | string[]> = Object.create(null);

  constructor(init?: HeadersInit) {
    if (init) this.extend(init);
  }

  set(headerName: string, value: string | string[]): void {
    this.object[headerName.toLowerCase()] =
      typeof value === "string" ? value : value.map(String);
  }

  append(headerName: string, value: string | string[]): void {
    const key = headerName.toLowerCase();
    const prevValue = this.object[key];
    // tslint:disable-next-line
    if (prevValue === undefined) {
      this.object[key] = typeof value === "string" ? value : value.map(String);
    } else if (Array.isArray(prevValue)) {
      if (Array.isArray(value)) {
        for (const v of value) prevValue.push(String(v));
      } else {
        prevValue.push(String(value));
      }
    } else {
      this.object[key] = Array.isArray(value)
        ? [prevValue, ...value.map(String)]
        : [prevValue, String(value)];
    }
  }

  get(headerName: string): string | null {
    const value = this.object[headerName.toLowerCase()];
    if (value === undefined) return null; // tslint:disable-line
    return Array.isArray(value) ? value[0] : value;
  }

  getAll(headerName: string): string[] {
    const value = this.object[headerName.toLowerCase()];
    if (value === undefined) return []; // tslint:disable-line
    return Array.isArray(value) ? [...value] : [value];
  }

  has(headerName: string): boolean {
    return headerName.toLowerCase() in this.object;
  }

  delete(headerName: string): void {
    delete this.object[headerName.toLowerCase()];
  }

  *entries(): IterableIterator<HeaderTuple> {
    yield* Object.entries(this.object);
  }

  *keys(): IterableIterator<string> {
    yield* Object.keys(this.object);
  }

  *values(): IterableIterator<string | string[]> {
    yield* Object.values(this.object);
  }

  clear(): void {
    this.object = Object.create(null);
  }

  asObject(): HeadersObject {
    return Object.assign(Object.create(null), this.object);
  }

  extend(obj: HeadersInit): void {
    if (Symbol.iterator in obj) {
      for (const [key, value] of obj as Iterable<HeaderTuple>) {
        this.append(key, value);
      }
    } else if (obj instanceof Headers) {
      for (const [key, value] of obj.entries()) this.append(key, value);
    } else {
      for (const key of Object.keys(obj)) {
        const value = (obj as HeadersObject)[key];
        if (value !== undefined) this.append(key, value);
      }
    }
  }

  clone(): Headers {
    return new Headers(this.object);
  }
}
