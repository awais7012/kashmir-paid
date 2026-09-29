import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../env.js";
import { HttpError } from "./http-error.js";

export type AuthAdmin = {
  id: string;
  email: string;
  role: string;
};

export function signAdminToken(admin: AuthAdmin): string {
  const options: SignOptions = {
    subject: admin.id,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign({ email: admin.email, role: admin.role }, env.JWT_SECRET, options);
}

export function verifyAdminToken(token: string): AuthAdmin {
  let payload: string | jwt.JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }

  if (typeof payload === "string" || !payload.sub) {
    throw new HttpError(401, "Invalid token payload");
  }

  const email = typeof payload["email"] === "string" ? payload["email"] : "";
  const role = typeof payload["role"] === "string" ? payload["role"] : "admin";

  return { id: payload.sub, email, role };
}
