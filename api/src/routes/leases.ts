import { Hono } from "hono";
import type { Env } from "../types.js";
import db from "../db.js";
import { requireAuth } from "../auth.js";

export const leasesRoutes = new Hono<Env>();
leasesRoutes.use("*", requireAuth);

// List leases with property + tenant names
leasesRoutes.get("/", (c) => {
  const userId = c.get("userId");
  const rows = db.prepare(`
    SELECT l.*,
      p.address as property_address, p.city as property_city,
      t.first_name || ' ' || t.last_name as tenant_name
    FROM leases l
    LEFT JOIN properties p ON p.id = l.property_id
    LEFT JOIN tenants t ON t.id = l.tenant_id
    WHERE l.owner_id = ?
    ORDER BY l.created_at DESC
  `).all(userId);

  return c.json(rows);
});

// Create lease (+ auto-create tenant if needed)
leasesRoutes.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();

  if (!body.property_id || !body.monthly_rent || !body.start_date || !body.end_date) {
    return c.json({ error: "Eiendom, leie, start- og sluttdato er påkrevd" }, 400);
  }

  // If tenant data provided instead of tenant_id, create tenant first
  let tenantId = body.tenant_id;
  if (!tenantId && body.tenant_first_name && body.tenant_last_name) {
    const tenant = db.prepare(
      "INSERT INTO tenants (owner_id, first_name, last_name, email, phone) VALUES (?, ?, ?, ?, ?) RETURNING id"
    ).get(userId, body.tenant_first_name, body.tenant_last_name, body.tenant_email, body.tenant_phone) as any;
    tenantId = tenant.id;
  }

  if (!tenantId) {
    return c.json({ error: "Leietaker er påkrevd" }, 400);
  }

  const result = db.prepare(`
    INSERT INTO leases (owner_id, property_id, tenant_id, monthly_rent, deposit, start_date, end_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `).get(userId, body.property_id, tenantId, body.monthly_rent, body.deposit || 0, body.start_date, body.end_date, body.notes);

  return c.json(result, 201);
});

// Update lease
leasesRoutes.put("/:id", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();

  const result = db.prepare(`
    UPDATE leases SET
      monthly_rent = coalesce(?, monthly_rent), status = coalesce(?, status),
      end_date = coalesce(?, end_date), notes = coalesce(?, notes),
      updated_at = datetime('now')
    WHERE id = ? AND owner_id = ?
    RETURNING *
  `).get(body.monthly_rent, body.status, body.end_date, body.notes, c.req.param("id"), userId);

  if (!result) return c.json({ error: "Ikke funnet" }, 404);
  return c.json(result);
});

// Terminate lease
leasesRoutes.post("/:id/terminate", (c) => {
  const userId = c.get("userId");
  const result = db.prepare(
    "UPDATE leases SET status = 'terminated', updated_at = datetime('now') WHERE id = ? AND owner_id = ? RETURNING *"
  ).get(c.req.param("id"), userId);

  if (!result) return c.json({ error: "Ikke funnet" }, 404);
  return c.json(result);
});
