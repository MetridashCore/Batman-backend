/**
 * An error that carries the HTTP status the client should receive.
 *
 * Anything thrown from a route handler reaches the central error handler; an
 * `ApiError` is the way to say "this is the client's fault, and here is why"
 * instead of falling through to a generic 500.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }

  static notFound(message = 'Not Found'): ApiError {
    return new ApiError(404, message)
  }
}
