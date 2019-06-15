import { Headers, HeadersInit } from "./headers";
import { Signal } from "./signal";

/**
 * Marker to indicate the body has been used.
 */
export const kBodyUsed = Symbol("bodyUsed");

/**
 * Marker to indicate the body has been destroyed and can not be used.
 */
export const kBodyDestroyed = Symbol("bodyDestroyed");

/**
 * Read and "use" the raw body from a `Body` instance.
 */
export function useRawBody<T>(body: CommonBody<T>) {
  const rawBody = getRawBody(body);
  if (rawBody === null) return null; // "Unused".
  body.$rawBody = kBodyUsed;
  return rawBody;
}

/**
 * Read the raw body from a `Body` instance.
 */
export function getRawBody<T>(body: CommonBody<T>) {
  const { $rawBody } = body;
  if ($rawBody === kBodyUsed) throw new TypeError("Body already used");
  if ($rawBody === kBodyDestroyed) throw new TypeError("Body is destroyed");
  return $rawBody;
}

/**
 * Support body input types.
 */
export type EmptyBody = null | undefined;

/**
 * Body constructor shape.
 */
export type CommonBodyConstructor<T, U extends T> = {
  new (body: T | EmptyBody, headers: Headers): CommonBody<U>;
};

/**
 * Abstract body shared between node.js and browsers.
 */
export interface CommonBody<T = unknown> {
  $rawBody: T | null | typeof kBodyUsed | typeof kBodyDestroyed;
  readonly bodyUsed: boolean;
  json(): Promise<any>;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
  clone(): CommonBody<T>;
  destroy(): Promise<void>;
}

/**
 * Request configuration.
 */
export interface CommonRequestOptions<T> {
  method?: string;
  body?: T;
  signal?: Signal;
  headers?: HeadersInit;
  omitDefaultHeaders?: boolean;
  trailer?: HeadersInit | Promise<HeadersInit>;
}

/**
 * Request implementation standard.
 */
export interface CommonRequest<T = unknown> extends CommonBody<T> {
  url: string;
  method: string;
  headers: Headers;
  trailer: Promise<Headers>;
  readonly signal: Signal;
  clone(): CommonRequest<T>;
}

/**
 * Response configuration.
 */
export interface CommonResponseOptions {
  status?: number;
  statusText?: string;
  headers?: HeadersInit;
  omitDefaultHeaders?: boolean;
  trailer?: HeadersInit | Promise<HeadersInit>;
}

/**
 * Response implementation standard.
 */
export interface CommonResponse<T = unknown> extends CommonBody<T> {
  status: number;
  statusText: string;
  headers: Headers;
  trailer: Promise<Headers>;
  clone(): CommonResponse<T>;
}
