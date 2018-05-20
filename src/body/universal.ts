import { Readable } from 'stream' // tslint:disable-line
import { createBody as createNodeBody, CreateBody as CreateNodeBody, Body as NodeBody } from './node'
import { CreateBody as CreateBrowserBody, Body as BrowserBody } from './browser'
import { CreateBodyOptions } from './common'

/**
 * Export mapped `Body` (e.g. `NodeBody` or `BrowserBody`).
 */
export { NodeBody as Body, NodeBody, BrowserBody }

/**
 * Supported `CreateBody` types.
 */
export type CreateBody = CreateNodeBody | CreateBrowserBody

/**
 * This function is changed at bundle time by tools like Browserify to
 * `./browser`. Unfortunately TypeScript doesn't support this so we do an
 * interesting hack by intersecting the valid return classes.
 */
export const createBody: (value?: CreateBody, options?: CreateBodyOptions) => NodeBody | BrowserBody = createNodeBody
