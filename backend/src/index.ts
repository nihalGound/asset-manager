import dotenv from "dotenv";
dotenv.config();
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { authRouter } from "./routes/auth";
import connectToDB from "./db/connection";
import { authMiddleware } from "./middleware/auth.middleware";
import { Request, Response } from "express";
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again after sometimes",
});

const app = express();
app.use(limiter);
app.use(
  cors({
    origin: process.env.FRONTEND_URL!,
    credentials: true,
  })
);
app.use(bodyParser.json());

connectToDB()
  .then(() => {
    console.log("DB connected successfully");
  })
  .catch((error) => {
    console.log("Error in db connection :", error);
  });

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/me", authMiddleware, (req: Request, res: Response) => {
  return res.status(200).json({ userId: req.userId });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
