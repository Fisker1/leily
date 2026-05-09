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

// ─── Admin Dashboard Summary ────────────────────────────
app.get("/api/admin/summary", requireAuth, (c) => {
  const userId = c.get("userId");

  const properties = db.prepare("SELECT * FROM properties WHERE owner_id = ?").all(userId) as any[];
  const activeLeases = db.prepare("SELECT * FROM leases WHERE owner_id = ? AND status = 'active'").all(userId) as any[];
  const tenants = db.prepare("SELECT * FROM tenants WHERE owner_id = ?").all(userId) as any[];

  // ── KPIs ──
  const totalPortfolioValue = properties.reduce((s: number, p: any) => s + (p.current_value || p.purchase_price || 0), 0);
  const totalLoan = properties.reduce((s: number, p: any) => s + (p.loan_amount || 0), 0);
  const totalEquity = totalPortfolioValue - totalLoan;

  const monthlyIncome = activeLeases.reduce((s: number, l: any) => s + (l.monthly_rent || 0), 0);

  // Compute costs per property (interest + 10% overhead)
  let monthlyCosts = 0;
  const propertyBreakdown = properties.map((p: any) => {
    const lease = activeLeases.find((l: any) => l.property_id === p.id);
    const rent = lease?.monthly_rent || p.monthly_rent || 0;
    const loanAmt = p.loan_amount || 0;
    const rate = p.interest_rate || 3.5;
    const monthlyInterest = (loanAmt * (rate / 100)) / 12;
    const overhead = rent * 0.1;
    const monthlyCost = Math.round(monthlyInterest + overhead);
    const cashflow = Math.round(rent - monthlyCost);
    const value = p.current_value || p.purchase_price || 0;
    const purchasePrice = p.purchase_price || value;
    const yieldPct = value > 0 ? Math.round(((rent * 12) / value) * 1000) / 10 : 0;
    const appreciation = purchasePrice > 0 ? Math.round(((value - purchasePrice) / purchasePrice) * 1000) / 10 : 0;

    monthlyCosts += monthlyCost;

    return {
      id: p.id,
      address: p.address,
      city: p.city || null,
      currentValue: value,
      purchasePrice,
      loanAmount: loanAmt,
      equity: value - loanAmt,
      monthlyRent: rent,
      monthlyCost,
      cashflow,
      yieldPct,
      appreciation,
      interestRate: rate,
      hasTenant: !!lease,
    };
  });

  const monthlyCashflow = monthlyIncome - monthlyCosts;
  const occupancy = properties.length > 0 ? (activeLeases.length / properties.length) * 100 : 0;
  const avgYield = properties.length > 0
    ? propertyBreakdown.reduce((s, p) => s + p.yieldPct, 0) / properties.length
    : 0;

  const kpis = {
    totalPortfolioValue,
    totalLoan,
    totalEquity,
    monthlyIncome,
    monthlyCosts,
    monthlyCashflow,
    properties: properties.length,
    occupancy,
    avgYield,
  };

  // ── Monthly trend (last 12 months from transactions) ──
  const now = new Date();
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const txRows = db.prepare(
    "SELECT * FROM transactions WHERE owner_id = ? AND date >= ? ORDER BY date ASC"
  ).all(userId, months[0] + "-01") as any[];

  const monthlyTrend = months.map((m) => {
    const monthTxs = txRows.filter((tx: any) => tx.date.startsWith(m));
    const income = monthTxs.filter((tx: any) => tx.type === "income").reduce((s: number, tx: any) => s + tx.amount, 0);
    const expense = monthTxs.filter((tx: any) => tx.type === "expense").reduce((s: number, tx: any) => s + tx.amount, 0);
    return { month: m, income: Math.round(income), expense: Math.round(expense), net: Math.round(income - expense) };
  });

  // If no transactions exist, fill trend with estimated values from properties
  const hasTxData = txRows.length > 0;
  if (!hasTxData) {
    monthlyTrend.forEach((m) => {
      m.income = monthlyIncome;
      m.expense = monthlyCosts;
      m.net = monthlyCashflow;
    });
  }

  // ── Expense by category (current month or all-time top) ──
  const currentMonth = months[months.length - 1];
  let expenseTxs = txRows.filter((tx: any) => tx.type === "expense" && tx.date.startsWith(currentMonth));
  if (expenseTxs.length === 0) {
    expenseTxs = txRows.filter((tx: any) => tx.type === "expense");
  }
  const catMap = new Map<string, number>();
  expenseTxs.forEach((tx: any) => {
    catMap.set(tx.category, (catMap.get(tx.category) || 0) + tx.amount);
  });
  const expenseByCategory = Array.from(catMap.entries())
    .map(([category, amount]) => ({ category, amount: Math.round(amount) }))
    .sort((a, b) => b.amount - a.amount);

  // ── Expiring leases (next 90 days) ──
  const in90 = new Date(now.getTime() + 90 * 86400000);
  const expiringLeases = activeLeases
    .filter((l: any) => {
      const end = new Date(l.end_date);
      return end >= now && end <= in90;
    })
    .map((l: any) => {
      const prop = properties.find((p: any) => p.id === l.property_id);
      const tenant = tenants.find((t: any) => t.id === l.tenant_id);
      return {
        id: l.id,
        end_date: l.end_date,
        property_address: prop ? `${prop.address}${prop.city ? `, ${prop.city}` : ""}` : "Ukjent",
        tenant_name: tenant ? `${tenant.first_name} ${tenant.last_name}` : "Ukjent",
      };
    });

  // ── Recent transactions ──
  const recentTransactions = db.prepare(
    "SELECT * FROM transactions WHERE owner_id = ? ORDER BY date DESC LIMIT 15"
  ).all(userId) as any[];

  return c.json({
    kpis,
    monthlyTrend,
    expenseByCategory,
    propertyBreakdown,
    expiringLeases,
    recentTransactions,
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
