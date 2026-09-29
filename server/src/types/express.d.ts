import type { AuthAdmin } from "../lib/jwt.js";

declare global {
  namespace Express {
    interface Request {
      admin?: AuthAdmin;
      validated: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}

export {};
