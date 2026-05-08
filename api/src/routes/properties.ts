import { Hono } from "hono";
import type { Env } from "../types.js";
import db from "../db.js";
import { requireAuth } from "../auth.js";

export const propertiesRoutes = new Hono<Env>();
propertiesRoutes.use("*", requireAuth);

// List all properties for user
propertiesRoutes.get("/", (c) => {
  const userId = c.get("userId");
  const rows = db.prepare(`
    SELECT p.*,
      (SELECT json_object(
        'id', l.id, 'tenant_id', l.tenant_id, 'monthly_rent', l.monthly_rent,
        'start_date', l.start_date, 'end_date', l.end_date,
        'tenant_name', t.first_name || ' ' || t.last_name
      )
      FROM leases l LEFT JOIN tenants t ON t.id = l.tenant_id
      WHERE l.property_id = p.id AND l.status = 'active'
      ORDER BY l.created_at DESC LIMIT 1
      ) as active_lease
    FROM properties p
    WHERE p.owner_id = ?
    ORDER BY p.created_at DESC
  `).all(userId) as any[];

  const parsed = rows.map((r) => ({
    ...r,
    active_lease: r.active_lease ? JSON.parse(r.active_lease) : null,
  }));

  return c.json(parsed);
});

// Get single property
propertiesRoutes.get("/:id", (c) => {
  const userId = c.get("userId");
  const row = db.prepare("SELECT * FROM properties WHERE id = ? AND owner_id = ?").get(c.req.param("id"), userId);
  if (!row) return c.json({ error: "Ikke funnet" }, 404);
  return c.json(row);
});

// Create property
propertiesRoutes.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();

  const result = db.prepare(`
    INSERT INTO properties (owner_id, address, city, postal_code, property_type, size_sqm, bedrooms, purchase_price, current_value, loan_amount, interest_rate, monthly_rent, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `).get(
    userId, body.address, body.city, body.postal_code, body.property_type || "Leilighet",
    body.size_sqm, body.bedrooms, body.purchase_price, body.current_value || body.purchase_price,
    body.loan_amount || 0, body.interest_rate || 3.5, body.monthly_rent || 0, body.notes
  );

  return c.json(result, 201);
});

// Update property
propertiesRoutes.put("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const body = await c.req.json();

  const existing = db.prepare("SELECT id FROM properties WHERE id = ? AND owner_id = ?").get(id, userId);
  if (!existing) return c.json({ error: "Ikke funnet" }, 404);

  const result = db.prepare(`
    UPDATE properties SET
      address = coalesce(?, address), city = coalesce(?, city), postal_code = coalesce(?, postal_code),
      property_type = coalesce(?, property_type), size_sqm = coalesce(?, size_sqm), bedrooms = coalesce(?, bedrooms),
      purchase_price = coalesce(?, purchase_price), current_value = coalesce(?, current_value),
      loan_amount = coalesce(?, loan_amount), interest_rate = coalesce(?, interest_rate),
      monthly_rent = coalesce(?, monthly_rent), notes = coalesce(?, notes),
      updated_at = datetime('now')
    WHERE id = ? AND owner_id = ?
    RETURNING *
  `).get(
    body.address, body.city, body.postal_code, body.property_type,
    body.size_sqm, body.bedrooms, body.purchase_price, body.current_value,
    body.loan_amount, body.interest_rate, body.monthly_rent, body.notes,
    id, userId
  );

  return c.json(result);
});

// Delete property
propertiesRoutes.delete("/:id", (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const result = db.prepare("DELETE FROM properties WHERE id = ? AND owner_id = ?").run(id, userId);
  if (result.changes === 0) return c.json({ error: "Ikke funnet" }, 404);
  return c.json({ ok: true });
});
