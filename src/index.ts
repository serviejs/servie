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

export const Body: typeof NodeBody | BrowserBody = NodeBody;
export const Request: typeof NodeRequest | typeof BrowserRequest = NodeRequest;
export const Response:
  | typeof NodeResponse
  | typeof BrowserResponse = NodeResponse;
