import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}