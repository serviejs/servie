import {
  Request as NodeRequest,
  Response as NodeResponse,
  Body as NodeBody
} from "./node";
import {
  Request as BrowserRequest,
  Response as BrowserResponse,
  Body as BrowserBody
} from "./browser";

export * from "./headers";
export * from "./signal";

export type Body = NodeBody | BrowserBody;
export const Body: typeof NodeBody | BrowserBody = NodeBody;
export type Request = NodeRequest | BrowserRequest;
export const Request: typeof NodeRequest | typeof BrowserRequest = NodeRequest;
export type Response = NodeResponse | BrowserResponse;
export const Response:
  | typeof NodeResponse
  | typeof BrowserResponse = NodeResponse;
