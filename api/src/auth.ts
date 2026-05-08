import { Context, Next } from "hono";
import type { Env } from "./types.js";
import { SignJWT, jwtVerify } from "jose";
import { hash, compare } from "bcryptjs";
import db from "./db.js";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "leily-dev-secret-change-me");

// ─── JWT helpers ─────────────────────────────────────────
export async function createToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, SECRET);
  return payload.sub as string;
}

// ─── Password helpers ────────────────────────────────────
export async function hashPassword(pw: string) {
  return hash(pw, 10);
}

export async function checkPassword(pw: string, hashed: string) {
  return compare(pw, hashed);
}

// ─── Auth middleware ─────────────────────────────────────
export async function requireAuth(c: Context<Env>, next: Next) {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Ikke autentisert" }, 401);
  }

  try {
    const userId = await verifyToken(header.slice(7));
    const user = db.prepare("SELECT id, email, full_name FROM users WHERE id = ?").get(userId) as any;
    if (!user) return c.json({ error: "Bruker ikke funnet" }, 401);
    c.set("user", user);
    c.set("userId", user.id);
    await next();
  } catch {
    return c.json({ error: "Ugyldig token" }, 401);
  }
}
