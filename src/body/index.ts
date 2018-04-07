import { Readable } from 'stream' // tslint:disable-line
import { Body } from './base'
import { createBody as createNodeBody, CreateBody as CreateNodeBody, NodeBody } from './node'
import { CreateBody as CreateBrowserBody, BrowserBody } from './browser'

type CreateBodyFn = (value?: CreateNodeBody | CreateBrowserBody) => NodeBody & BrowserBody

/**
 * This function is changed at bundle time by tools like Browserify to
 * `./browser`. Unfortunately TypeScript doesn't support this so we do an
 * interesting hack by intersecting the valid return classes.
 */
export const createBody = createNodeBody as CreateBodyFn

export { Body, NodeBody, BrowserBody }
