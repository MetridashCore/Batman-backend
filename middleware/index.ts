import { Request, Response, NextFunction } from 'express';
import admin from './../firebase';

class Middleware {
  async decodeToken(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const decodeValue = await admin.auth().verifyIdToken(token);
        if (decodeValue) {
          console.log(decodeValue);
          return next();
        }
        return res.json({ message: 'Unauthorized' });
      } catch (e) {
        return res.json({ message: 'Internal Error' });
      }
    } else {
      return res.json({ message: 'Unauthorized' });
    }
  }
}

export default new Middleware();