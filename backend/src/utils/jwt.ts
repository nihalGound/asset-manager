import jwt, { SignOptions } from "jsonwebtoken";

export interface JwtPayload {
  userId: string;
}

export const generateToken = (
  payload: object,
  secretKey: string,
  expiresIn: string
) => {
  //@ts-ignore
  const options: SignOptions = { expiresIn: expiresIn };
  const token = jwt.sign(payload, secretKey, options);
  return token;
};

export const verifyToken = (token: string, secretKey: string) => {
  const decoded = jwt.verify(token, secretKey) as JwtPayload;
  return decoded;
};
