import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { verifyToken } from "../utils/jwt";
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Access token missing or malformed" });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token, process.env.JWT_ACCESS_SECRET!);

    if (!payload || typeof payload !== "object" || !("userId" in payload)) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Invalid access token" });
    }

    req.userId = payload.userId as string;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Invalid or expired token" });
  }
};
