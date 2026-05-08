import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { Env } from "./types.js";
import db from "./db.js";
import { requireAuth, createToken, hashPassword, checkPassword } from "./auth.js";
import { propertiesRoutes } from "./routes/properties.js";
import { leasesRoutes } from "./routes/leases.js";
import { tenantsRoutes } from "./routes/tenants.js";
import { financeRoutes } from "./routes/finance.js";
import { messagesRoutes } from "./routes/messages.js";

const app = new Hono<Env>();

// ─── Middleware ──────────────────────────────────────────
app.use("*", cors({ origin: "*" }));
app.use("*", logger());

// ─── Health check ───────────────────────────────────────
app.get("/api/health", (c) => c.json({ status: "ok" }));

// ─── Auth routes (public) ───────────────────────────────
app.post("/api/auth/register", async (c) => {
  const { email, password, full_name } = await c.req.json();
  if (!email || !password) {
    return c.json({ error: "E-post og passord er påkrevd" }, 400);
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return c.json({ error: "E-postadressen er allerede registrert" }, 409);
  }

  const hashed = await hashPassword(password);
  const result = db.prepare(
    "INSERT INTO users (email, password, full_name) VALUES (?, ?, ?) RETURNING id, email, full_name, created_at"
  ).get(email.toLowerCase().trim(), hashed, full_name || null) as any;

  const token = await createToken(result.id);
  return c.json({ user: { id: result.id, email: result.email, full_name: result.full_name }, token });
});

app.post("/api/auth/login", async (c) => {
  const { email, password } = await c.req.json();
  if (!email || !password) {
    return c.json({ error: "E-post og passord er påkrevd" }, 400);
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim()) as any;
  if (!user || !(await checkPassword(password, user.password))) {
    return c.json({ error: "Feil e-post eller passord" }, 401);
  }

  const token = await createToken(user.id);
  return c.json({
    user: { id: user.id, email: user.email, full_name: user.full_name },
    token,
  });
});

app.get("/api/auth/me", requireAuth, (c) => {
  return c.json({ user: c.get("user") });
});

// ─── Dashboard stats ────────────────────────────────────
app.get("/api/dashboard", requireAuth, (c) => {
  const userId = c.get("userId");

  const properties = db.prepare("SELECT * FROM properties WHERE owner_id = ?").all(userId) as any[];
  const activeLeases = db.prepare("SELECT * FROM leases WHERE owner_id = ? AND status = 'active'").all(userId) as any[];
  const tenants = db.prepare("SELECT * FROM tenants WHERE owner_id = ?").all(userId) as any[];

  const totalIncome = activeLeases.reduce((s: number, l: any) => s + (l.monthly_rent || 0), 0);
  const totalValue = properties.reduce((s: number, p: any) => s + (p.current_value || p.purchase_price || 0), 0);
  const totalLoan = properties.reduce((s: number, p: any) => s + (p.loan_amount || 0), 0);
  const occupancy = properties.length > 0 ? (activeLeases.length / properties.length) * 100 : 0;
  const avgYield = totalValue > 0 ? ((totalIncome * 12) / totalValue) * 100 : 0;

  // Expiring leases (60 days)
  const now = new Date();
  const in60 = new Date(now.getTime() + 60 * 86400000);
  const expiring = activeLeases
    .filter((l: any) => {
      const end = new Date(l.end_date);
      return end >= now && end <= in60;
    })
    .map((l: any) => {
      const prop = properties.find((p: any) => p.id === l.property_id);
      const tenant = tenants.find((t: any) => t.id === l.tenant_id);
      return {
        id: l.id,
        end_date: l.end_date,
        property_address: prop ? `${prop.address}, ${prop.city || ""}` : "Ukjent",
        tenant_name: tenant ? `${tenant.first_name} ${tenant.last_name}` : "Ukjent",
      };
    });

  return c.json({
    properties: properties.length,
    tenants: tenants.length,
    activeLeases: activeLeases.length,
    monthlyIncome: totalIncome,
    totalValue,
    totalLoan,
    equity: totalValue - totalLoan,
    occupancy,
    avgYield,
    expiringLeases: expiring,
  });
});

// ─── Feature routes ─────────────────────────────────────
app.route("/api/properties", propertiesRoutes);
app.route("/api/leases", leasesRoutes);
app.route("/api/tenants", tenantsRoutes);
app.route("/api/finance", financeRoutes);
app.route("/api/messages", messagesRoutes);

// ─── Start ──────────────────────────────────────────────
const port = Number(process.env.PORT) || 3000;
console.log(`Leily API running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
