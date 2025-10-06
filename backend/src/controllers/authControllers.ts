import { StatusCodes } from "http-status-codes";
import { User } from "../db/schema";
import { Request, Response } from "express";
import { generateToken, verifyToken } from "../utils/jwt";

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User not found" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Invalid credentials" });
    }
    const accessToken = generateToken(
      { userId: user.id },
      process.env.JWT_ACCESS_SECRET!,
      process.env.JWT_ACCESS_EXPIRY!
    );
    const refreshToken = generateToken(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      process.env.JWT_REFRESH_EXPIRY!
    );
    user.refreshToken = refreshToken;
    await user.save();
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });
    return res.status(StatusCodes.OK).json({ accessToken });
  } catch (error) {
    console.log(error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "User already exists" });
    }
    await User.create({ name, email, password });
    return res
      .status(StatusCodes.CREATED)
      .json({ message: "User created successfully" });
  } catch (error) {
    console.log(error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies["refreshToken"];
    if (!refreshToken) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Refresh token not found" });
    }
    const payload = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET!);
    if (!payload || typeof payload !== "object" || !("userId" in payload)) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Invalid refresh token" });
    }
    const user = await User.findById(payload.userId);
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "User not found" });
    }
    const accessToken = generateToken(
      { userId: user.id },
      process.env.JWT_ACCESS_SECRET!,
      process.env.JWT_ACCESS_EXPIRY!
    );
    return res.status(StatusCodes.OK).json({ accessToken });
  } catch (error) {
    console.log(error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
};
