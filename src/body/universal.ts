import { Readable } from 'stream' // tslint:disable-line
import { createBody as createNodeBody, CreateBody as CreateNodeBody, Body as NodeBody } from './node'
import { CreateBody as CreateBrowserBody, Body as BrowserBody } from './browser'

export { NodeBody as Body }

export type CreateBodyFn = (value?: CreateNodeBody | CreateBrowserBody) => NodeBody | BrowserBody

/**
 * This function is changed at bundle time by tools like Browserify to
 * `./browser`. Unfortunately TypeScript doesn't support this so we do an
 * interesting hack by intersecting the valid return classes.
 */
export const createBody: CreateBodyFn = createNodeBody
