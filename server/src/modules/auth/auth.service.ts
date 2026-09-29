import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { type AdminRow, admins } from "../../db/schema.js";

export async function findAdminByEmail(email: string): Promise<AdminRow | null> {
  const rows = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
  return rows[0] ?? null;
}

export async function findAdminById(id: string): Promise<AdminRow | null> {
  const rows = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
  return rows[0] ?? null;
}
