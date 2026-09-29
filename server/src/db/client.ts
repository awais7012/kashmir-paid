import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "../env.js";
import * as schema from "./schema.js";

// timezone "Z" keeps DATETIME values in UTC regardless of the server's local
// timezone, so published_at round-trips as a stable ISO timestamp.
export const pool = mysql.createPool({
  uri: env.DATABASE_URL,
  connectionLimit: 10,
  waitForConnections: true,
  enableKeepAlive: true,
  timezone: "Z",
});

export const db = drizzle(pool, { schema, mode: "default" });

export async function closePool(): Promise<void> {
  await pool.end();
}
