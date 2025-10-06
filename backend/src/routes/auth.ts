import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { validateSchema } from "../middleware/zodSchemaValidation";
import { loginSchema, registerSchema } from "../schemas/authSchema";
import {
  loginUser,
  refreshAccessToken,
  registerUser,
} from "../controllers/authControllers";

const router = express.Router();

router.post("/login", validateSchema(loginSchema), loginUser);

router.post("/register", validateSchema(registerSchema), registerUser);

router.post("/refresh", refreshAccessToken);

export const authRouter = router;
