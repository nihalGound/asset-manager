import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Invalid email" }),
  password: z.string().min(8).max(20, {
    error: "Password must be between 8 and 20 characters long",
  }),
});

export const registerSchema = z.object({
  email: z.email({ error: "Invalid email" }),
  password: z
    .string()
    .min(8)
    .max(20, { error: "Password must be between 8 and 20 characters long" }),
  name: z
    .string()
    .min(3)
    .max(20, { error: "Name must be between 3 and 20 characters long" }),
});
