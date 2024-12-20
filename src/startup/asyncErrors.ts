import type { Express, NextFunction, Request, Response } from 'express'

export function asyncErrors(app: Express) {
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    res.json({ message: 'Internal Server Error' })
  })
}
