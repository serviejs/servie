import { Headers, HeadersInit } from "./headers";
import { Signal } from "./signal";

/**
 * Read and "use" the raw body from a `Body` instance.
 */
export function useRawBody<T>(body: CommonBody<T>) {
  const rawBody = body.rawBody;
  if (rawBody === null) return null; // "Unused".
  body.$rawBody = undefined;
  return rawBody;
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
  $rawBody: T | null | undefined; // Use `undefined` as a mark of "used".
  headers: Headers;
  readonly bodyUsed: boolean;
  readonly rawBody: T | null;
  json(): Promise<any>;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
  clone(): CommonBody<T>;
}

/**
 * Request configuration.
 */
export interface CommonRequestOptions<T> {
  method?: string;
  body?: T;
  signal?: Signal;
  headers?: HeadersInit;
  trailer?: HeadersInit | Promise<HeadersInit>;
}

/**
 * Request implementation standard.
 */
export interface CommonRequest<T = unknown> extends CommonBody<T> {
  url: string;
  method: string;
  signal: Signal;
  trailer: Promise<Headers>;
  clone(): CommonRequest<T>;
}

/**
 * Response configuration.
 */
export interface CommonResponseOptions {
  status?: number;
  statusText?: string;
  headers?: HeadersInit;
  trailer?: HeadersInit | Promise<HeadersInit>;
}

/**
 * Response implementation standard.
 */
export interface CommonResponse<T = unknown> extends CommonBody<T> {
  status: number;
  statusText: string;
  trailer: Promise<Headers>;
  clone(): CommonResponse<T>;
}
