import { Hono } from "hono";
import type { Env } from "../types.js";
import db from "../db.js";
import { requireAuth } from "../auth.js";

export const tenantsRoutes = new Hono<Env>();
tenantsRoutes.use("*", requireAuth);

tenantsRoutes.get("/", (c) => {
  const rows = db.prepare("SELECT * FROM tenants WHERE owner_id = ? ORDER BY created_at DESC").all(c.get("userId"));
  return c.json(rows);
});

tenantsRoutes.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  if (!body.first_name || !body.last_name) {
    return c.json({ error: "Fornavn og etternavn er påkrevd" }, 400);
  }

  const result = db.prepare(
    "INSERT INTO tenants (owner_id, first_name, last_name, email, phone) VALUES (?, ?, ?, ?, ?) RETURNING *"
  ).get(userId, body.first_name, body.last_name, body.email, body.phone);

  return c.json(result, 201);
});

tenantsRoutes.put("/:id", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();

  const result = db.prepare(`
    UPDATE tenants SET
      first_name = coalesce(?, first_name), last_name = coalesce(?, last_name),
      email = coalesce(?, email), phone = coalesce(?, phone)
    WHERE id = ? AND owner_id = ?
    RETURNING *
  `).get(body.first_name, body.last_name, body.email, body.phone, c.req.param("id"), userId);

  if (!result) return c.json({ error: "Ikke funnet" }, 404);
  return c.json(result);
});

tenantsRoutes.delete("/:id", (c) => {
  const result = db.prepare("DELETE FROM tenants WHERE id = ? AND owner_id = ?").run(c.req.param("id"), c.get("userId"));
  if (result.changes === 0) return c.json({ error: "Ikke funnet" }, 404);
  return c.json({ ok: true });
});
