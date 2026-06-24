import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; role: string };
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  console.log(req.headers)

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: { message: "No token provided" } });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET!) as unknown as { userId: string; role: string };
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: { message: "Invalid or expired token" } });
  }
}
