import { Hono } from "hono";
import type { Env } from "../types.js";
import db from "../db.js";
import { requireAuth } from "../auth.js";

export const messagesRoutes = new Hono<Env>();
messagesRoutes.use("*", requireAuth);

// Get messages for a lease
messagesRoutes.get("/:leaseId", (c) => {
  const userId = c.get("userId");
  const leaseId = c.req.param("leaseId");

  // Verify lease belongs to user
  const lease = db.prepare("SELECT id FROM leases WHERE id = ? AND owner_id = ?").get(leaseId, userId);
  if (!lease) return c.json({ error: "Ikke funnet" }, 404);

  const messages = db.prepare(
    "SELECT * FROM messages WHERE lease_id = ? ORDER BY created_at ASC"
  ).all(leaseId);

  return c.json(messages);
});

// Send message
messagesRoutes.post("/:leaseId", async (c) => {
  const userId = c.get("userId");
  const leaseId = c.req.param("leaseId");
  const body = await c.req.json();

  const lease = db.prepare("SELECT id FROM leases WHERE id = ? AND owner_id = ?").get(leaseId, userId);
  if (!lease) return c.json({ error: "Ikke funnet" }, 404);

  if (!body.content) return c.json({ error: "Melding er påkrevd" }, 400);

  const result = db.prepare(
    "INSERT INTO messages (owner_id, lease_id, sender, content) VALUES (?, ?, ?, ?) RETURNING *"
  ).get(userId, leaseId, body.sender || "landlord", body.content);

  return c.json(result, 201);
});
