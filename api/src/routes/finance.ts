import { Hono } from "hono";
import type { Env } from "../types.js";
import db from "../db.js";
import { requireAuth } from "../auth.js";

export const financeRoutes = new Hono<Env>();
financeRoutes.use("*", requireAuth);

// Financial overview per property
financeRoutes.get("/overview", (c) => {
  const userId = c.get("userId");

  const properties = db.prepare("SELECT * FROM properties WHERE owner_id = ?").all(userId) as any[];
  const activeLeases = db.prepare("SELECT * FROM leases WHERE owner_id = ? AND status = 'active'").all(userId) as any[];

  const perProperty = properties.map((p: any) => {
    const lease = activeLeases.find((l: any) => l.property_id === p.id);
    const rent = lease?.monthly_rent || p.monthly_rent || 0;
    const loanAmt = p.loan_amount || 0;
    const rate = p.interest_rate || 3.5;
    const monthlyInterest = (loanAmt * (rate / 100)) / 12;
    const overhead = rent * 0.1;
    const monthlyCost = monthlyInterest + overhead;
    const cashflow = rent - monthlyCost;
    const value = p.current_value || p.purchase_price || 0;
    const yieldPct = value > 0 ? ((rent * 12) / value) * 100 : 0;

    return {
      id: p.id,
      address: p.address,
      city: p.city,
      monthly_rent: rent,
      monthly_cost: Math.round(monthlyCost),
      cashflow: Math.round(cashflow),
      purchase_price: p.purchase_price || 0,
      current_value: value,
      loan_amount: loanAmt,
      interest_rate: rate,
      yield_pct: Math.round(yieldPct * 10) / 10,
      has_tenant: !!lease,
    };
  });

  const totals = {
    income: perProperty.reduce((s, p) => s + p.monthly_rent, 0),
    costs: perProperty.reduce((s, p) => s + p.monthly_cost, 0),
    cashflow: perProperty.reduce((s, p) => s + p.cashflow, 0),
    portfolio_value: perProperty.reduce((s, p) => s + p.current_value, 0),
    total_loan: perProperty.reduce((s, p) => s + p.loan_amount, 0),
    avg_yield: perProperty.length > 0
      ? perProperty.reduce((s, p) => s + p.yield_pct, 0) / perProperty.length
      : 0,
  };

  return c.json({ properties: perProperty, totals });
});

// Transactions CRUD
financeRoutes.get("/transactions", (c) => {
  const userId = c.get("userId");
  const limit = Number(c.req.query("limit")) || 50;
  const rows = db.prepare(
    "SELECT * FROM transactions WHERE owner_id = ? ORDER BY date DESC LIMIT ?"
  ).all(userId, limit);
  return c.json(rows);
});

financeRoutes.post("/transactions", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();

  if (!body.type || !body.category || !body.amount || !body.date) {
    return c.json({ error: "Type, kategori, beløp og dato er påkrevd" }, 400);
  }

  const result = db.prepare(`
    INSERT INTO transactions (owner_id, property_id, lease_id, type, category, amount, description, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `).get(userId, body.property_id, body.lease_id, body.type, body.category, body.amount, body.description, body.date);

  return c.json(result, 201);
});

financeRoutes.delete("/transactions/:id", (c) => {
  const result = db.prepare("DELETE FROM transactions WHERE id = ? AND owner_id = ?").run(c.req.param("id"), c.get("userId"));
  if (result.changes === 0) return c.json({ error: "Ikke funnet" }, 404);
  return c.json({ ok: true });
});
