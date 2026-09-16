import type { Express } from 'express'
import type { AddressInfo } from 'node:net'

export interface TestResponse {
  status: number
  body: unknown
}

/**
 * Boots an app on an ephemeral port and returns a request helper plus a
 * teardown. Avoids pulling in supertest for what is a handful of calls.
 */
export async function startTestServer(app: Express) {
  const server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))

  const { port } = server.address() as AddressInfo

  async function request(
    method: string,
    path: string,
    body?: unknown
  ): Promise<TestResponse> {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })

    const text = await response.text()
    return {
      status: response.status,
      body: text ? JSON.parse(text) : null,
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
