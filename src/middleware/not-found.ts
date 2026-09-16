import type { NextFunction, Request, Response } from 'express'
import { ApiError } from '../http/api-error.ts'

/**
 * Mounted after every route, so an unknown path produces the same error
 * envelope as every other failure rather than Express' default HTML page.
 */
export function notFound(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  next(ApiError.notFound(`Cannot ${req.method} ${req.path}`))
}
