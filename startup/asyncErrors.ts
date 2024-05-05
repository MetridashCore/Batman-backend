import type { Express, NextFunction, Request, Response } from 'express'

export default function asyncErrors(app: Express) {
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    return res.json({ message: 'Internal Server Error' })
  })
}
