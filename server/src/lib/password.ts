import { compare, hash } from "bcryptjs";
import { env } from "../env.js";

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, env.BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, passwordHash: string): Promise<boolean> {
  return compare(plain, passwordHash);
}
