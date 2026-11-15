import type { Express } from 'express'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll } from 'vitest'

/** The error envelope every failure response uses (see error-handler.ts). */
export interface ApiErrorBody {
  message: string
  details?: unknown
  detail?: string
  issues?: { field: string; message: string }[]
}

/**
 * A response body from this API: always a JSON object. `error` is typed so
 * failure assertions are checked; success payloads stay loose.
 */
export type ApiBody = { error: ApiErrorBody; [key: string]: any }

export interface TestResponse<T = ApiBody> {
  status: number
  headers: Headers
  /** Parsed JSON, or `null` when the response had no body (e.g. 204). */
  body: T
}

export interface HeaderOptions {
  /** Case-insensitive; a caller's header replaces any default of that name. */
  headers?: Record<string, string>
}

/** A JSON `body` or a verbatim `raw` payload - never both. */
export type RequestOptions = HeaderOptions &
  (
    | { body?: unknown; raw?: never }
    /** Sent verbatim, e.g. malformed JSON or a form-encoded string. */
    | { raw: string; body?: never }
  )

/**
 * Boots an app on an ephemeral port and returns a request helper plus a
 * teardown. Avoids pulling in supertest for what is a handful of calls.
 */
export async function startTestServer(app: Express) {
  const server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))

  const { port } = server.address() as AddressInfo

  async function request<T = ApiBody>(
    method: string,
    path: string,
    options: RequestOptions = {}
  ): Promise<TestResponse<T>> {
    const { body, raw } = options
    if (body !== undefined && raw !== undefined) {
      throw new Error('Pass either `body` or `raw`, not both')
    }

    const headers = new Headers(options.headers)
    if (body !== undefined && !headers.has('content-type')) {
      headers.set('content-type', 'application/json')
    }

    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers,
      body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
    })

    const text = await response.text()
    const contentType = response.headers.get('content-type') ?? ''

    // Every response from this API is JSON or empty. Fail here, with the
    // payload in the message, rather than later on `res.body.error.message`
    // with a bare "cannot read properties of undefined".
    if (text && !contentType.includes('json')) {
      throw new Error(
        `Expected JSON from ${method} ${path}, got ${response.status} ` +
          `${contentType || '(no content-type)'}: ${text.slice(0, 200)}`
      )
    }

    return {
      status: response.status,
      headers: response.headers,
      body: (text ? JSON.parse(text) : null) as T,
    }
  }

  return {
    request,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      ),
  }
}

/**
 * Starts the app once per spec file and returns a client for it.
 *
 * `createApp` is passed in rather than imported here so the app (and the
 * provider modules it pulls in) loads after the spec's mocks are registered.
 */
export function useTestServer(createApp: () => Express) {
  let server: Awaited<ReturnType<typeof startTestServer>> | undefined

  beforeAll(async () => {
    server = await startTestServer(createApp())
  })
  // Guarded so a failed start reports only its own error, not a second one.
  afterAll(() => server?.close())

  function send<T>(method: string, path: string, options?: RequestOptions) {
    if (!server) throw new Error('Test server did not start; see beforeAll')
    return server.request<T>(method, path, options)
  }

  return {
    get: <T = ApiBody>(path: string, options?: HeaderOptions) =>
      send<T>('GET', path, options),
    post: <T = ApiBody>(path: string, body?: unknown, options?: HeaderOptions) =>
      send<T>('POST', path, { ...options, body }),
    put: <T = ApiBody>(path: string, body?: unknown, options?: HeaderOptions) =>
      send<T>('PUT', path, { ...options, body }),
    delete: <T = ApiBody>(path: string, options?: HeaderOptions) =>
      send<T>('DELETE', path, options),
    request: <T = ApiBody>(method: string, path: string, options?: RequestOptions) =>
      send<T>(method, path, options),
  }
}

/** Field names from a validation-failure response, for terse assertions. */
export function invalidFields(body: ApiBody): string[] {
  if (!body?.error?.issues) {
    throw new Error(`Expected a validation failure, got ${JSON.stringify(body)}`)
  }
  return body.error.issues.map((issue) => issue.field)
}
