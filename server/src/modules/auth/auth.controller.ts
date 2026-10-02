import type { Request, Response } from "express";
import { HttpError } from "../../lib/http-error.js";
import { signAdminToken } from "../../lib/jwt.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import type { ChangePasswordInput, LoginInput } from "./auth.schema.js";
import { findAdminByEmail, findAdminById, updateAdminPassword } from "./auth.service.js";

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.validated.body as LoginInput;

  const admin = await findAdminByEmail(email);
  const passwordMatches = admin ? await verifyPassword(password, admin.passwordHash) : false;

  if (!admin || !passwordMatches) {
    throw new HttpError(401, "Invalid email or password");
  }

  const token = signAdminToken({ id: admin.id, email: admin.email, role: admin.role });

  res.json({
    data: {
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    },
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  const current = req.admin;
  if (!current) {
    throw new HttpError(401, "Not authenticated");
  }

  const admin = await findAdminById(current.id);
  if (!admin) {
    throw new HttpError(401, "Account no longer exists");
  }

  res.json({
    data: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
  });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const current = req.admin;
  if (!current) {
    throw new HttpError(401, "Not authenticated");
  }

  const { currentPassword, newPassword } = req.validated.body as ChangePasswordInput;

  const admin = await findAdminById(current.id);
  if (!admin) {
    throw new HttpError(401, "Account no longer exists");
  }

  // Possession of a valid token is not enough; the editor must re-prove the
  // password they are replacing before a new one is written.
  const passwordMatches = await verifyPassword(currentPassword, admin.passwordHash);
  if (!passwordMatches) {
    throw new HttpError(401, "Current password is incorrect");
  }

  await updateAdminPassword(admin.id, await hashPassword(newPassword));

  res.status(204).end();
}
