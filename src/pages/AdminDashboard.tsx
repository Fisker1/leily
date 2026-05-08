import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2, TrendingUp, TrendingDown, Wallet, Users, AlertTriangle,
  PieChart, BarChart3, ArrowUpRight, ArrowDownRight, Home, Percent,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RPieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart,
} from "recharts";
import { adminDashboard, AdminSummary } from "@/api/client";
import { useState, useEffect } from "react";

/* ── helpers ─────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 0 }).format(n);

const fmtMonth = (m: string) => {
  const [y, mo] = m.split("-");
  const labels = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];
  return `${labels[parseInt(mo) - 1]} ${y.slice(2)}`;
};

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 220 70% 50%))",
  "hsl(var(--chart-3, 340 75% 55%))",
  "hsl(var(--chart-4, 160 60% 45%))",
  "hsl(var(--chart-5, 30 80% 55%))",
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
];

/* ── main component ──────────────────────────────────── */
const AdminDashboard = () => {
  const [data, setData] = useState<AdminSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminDashboard
      .summary()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <AppShell title="Admin Dashboard">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Admin Dashboard">
        <Card className="border-destructive">
          <CardContent className="p-6 text-center text-destructive">
            <p className="font-semibold">Feil ved lasting</p>
            <p className="text-sm mt-1">{error}</p>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const k = data.kpis;
  const ltv = k.totalPortfolioValue > 0 ? (k.totalLoan / k.totalPortfolioValue) * 100 : 0;

  return (
    <AppShell title="Admin Dashboard" subtitle="Portefølje &amp; økonomi">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-9">
          <TabsTrigger value="overview" className="text-xs">Oversikt</TabsTrigger>
          <TabsTrigger value="expenses" className="text-xs">Utgifter</TabsTrigger>
          <TabsTrigger value="properties" className="text-xs">Eiendommer</TabsTrigger>
        </TabsList>

        {/* ═══════════════ TAB: OVERVIEW ═══════════════ */}
        <TabsContent value="overview" className="space-y-4">
          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-3">
            <KPI icon={<Building2 className="h-4 w-4" />} label="Porteføljeverdi" value={`${fmt(k.totalPortfolioValue)} kr`} positive />
            <KPI icon={<Wallet className="h-4 w-4" />} label="Egenkapital" value={`${fmt(k.totalEquity)} kr`} positive />
            <KPI icon={<TrendingUp className="h-4 w-4" />} label="Mnd. inntekt" value={`${fmt(k.monthlyIncome)} kr`} positive />
            <KPI icon={<TrendingDown className="h-4 w-4" />} label="Mnd. kostnader" value={`${fmt(k.monthlyCosts)} kr`} />
          </div>

          {/* Cashflow highlight */}
          <Card className={k.monthlyCashflow >= 0 ? "border-green-300 bg-green-50 dark:bg-green-950/20" : "border-red-300 bg-red-50 dark:bg-red-950/20"}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {k.monthlyCashflow >= 0 ? (
                  <ArrowUpRight className="h-5 w-5 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-5 w-5 text-red-600" />
                )}
                <span className="text-sm font-semibold">Månedlig pengestrøm</span>
              </div>
              <span className={`text-lg font-bold ${k.monthlyCashflow >= 0 ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                {k.monthlyCashflow >= 0 ? "+" : ""}{fmt(k.monthlyCashflow)} kr
              </span>
            </CardContent>
          </Card>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <MiniKPI label="Eiendommer" value={String(k.properties)} />
            <MiniKPI label="Belegg" value={`${k.occupancy.toFixed(0)}%`} />
            <MiniKPI label="Avkastning" value={`${k.avgYield.toFixed(1)}%`} />
          </div>

          {/* LTV bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Belåningsgrad (LTV)</span>
                <span className="font-semibold">{ltv.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${ltv > 80 ? "bg-red-500" : ltv > 60 ? "bg-yellow-500" : "bg-green-500"}`}
                  style={{ width: `${Math.min(ltv, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Lån: {fmt(k.totalLoan)} kr</span>
                <span>Verdi: {fmt(k.totalPortfolioValue)} kr</span>
              </div>
            </CardContent>
          </Card>

          {/* Monthly income vs expense trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Inntekt vs. utgifter (12 mnd)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.monthlyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => `${fmt(value)} kr`}
                    labelFormatter={fmtMonth}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey="income" name="Inntekt" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="expense" name="Utgifter" fill="hsl(var(--destructive, 0 84% 60%))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Net cashflow trend line */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Netto pengestrøm
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={data.monthlyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => `${fmt(value)} kr`}
                    labelFormatter={fmtMonth}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Area type="monotone" dataKey="net" name="Netto" stroke="hsl(var(--primary))" fill="url(#netGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Expiring leases */}
          {data.expiringLeases.length > 0 && (
            <Card className="border-orange-300 bg-orange-50 dark:bg-orange-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-semibold text-orange-800 dark:text-orange-200">Kontrakter som utløper</span>
                </div>
                {data.expiringLeases.map((l) => (
                  <div key={l.id} className="flex justify-between text-sm mb-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{l.property_address}</p>
                      <p className="text-xs text-muted-foreground">{l.tenant_name}</p>
                    </div>
                    <Badge variant="outline" className="text-orange-700 border-orange-300 ml-2 flex-shrink-0">
                      {new Date(l.end_date).toLocaleDateString("nb-NO")}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════════ TAB: EXPENSES ═══════════════ */}
        <TabsContent value="expenses" className="space-y-4">
          {/* Monthly totals */}
          <div className="grid grid-cols-2 gap-3">
            <KPI icon={<TrendingDown className="h-4 w-4" />} label="Mnd. utgifter" value={`${fmt(k.monthlyCosts)} kr`} />
            <KPI icon={<Percent className="h-4 w-4" />} label="Kostnadsandel" value={`${k.monthlyIncome > 0 ? ((k.monthlyCosts / k.monthlyIncome) * 100).toFixed(0) : 0}%`} positive={k.monthlyCosts < k.monthlyIncome} />
          </div>

          {/* Expense category pie chart */}
          {data.expenseByCategory.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <PieChart className="h-4 w-4" /> Utgifter etter kategori
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <ResponsiveContainer width="100%" height={260}>
                  <RPieChart>
                    <Pie
                      data={data.expenseByCategory}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                      paddingAngle={2}
                      label={({ category, percent }: { category: string; percent: number }) =>
                        `${category} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={{ strokeWidth: 1 }}
                    >
                      {data.expenseByCategory.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${fmt(value)} kr`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </RPieChart>
                </ResponsiveContainer>

                {/* Category table */}
                <div className="mt-2 space-y-2 px-2">
                  {data.expenseByCategory.map((cat, i) => (
                    <div key={cat.category} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="capitalize">{cat.category}</span>
                      </div>
                      <span className="font-medium">{fmt(cat.amount)} kr</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <PieChart className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Ingen utgifter registrert denne måneden</p>
              </CardContent>
            </Card>
          )}

          {/* Expense trend bar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Utgiftsutvikling (12 mnd)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.monthlyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => `${fmt(value)} kr`} labelFormatter={fmtMonth} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="expense" name="Utgifter" fill="hsl(var(--destructive, 0 84% 60%))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent transactions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Siste transaksjoner</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data.recentTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Ingen transaksjoner</p>
              ) : (
                <div className="divide-y">
                  {data.recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{tx.description || tx.category}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString("nb-NO")} &middot; {tx.category}
                        </p>
                      </div>
                      <span className={`text-sm font-bold ml-3 flex-shrink-0 ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                        {tx.type === "income" ? "+" : "-"}{fmt(tx.amount)} kr
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════ TAB: PROPERTIES ═══════════════ */}
        <TabsContent value="properties" className="space-y-4">
          {/* Portfolio value summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold">Porteføljeverdier</span>
                <span className="text-lg font-bold">{fmt(k.totalPortfolioValue)} kr</span>
              </div>
              <div className="space-y-2">
                <ValueRow label="Totalt lån" value={k.totalLoan} color="text-red-600" />
                <ValueRow label="Total egenkapital" value={k.totalEquity} color="text-green-600" />
              </div>
            </CardContent>
          </Card>

          {/* Property value chart */}
          {data.propertyBreakdown.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Verdi per eiendom
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <ResponsiveContainer width="100%" height={Math.max(180, data.propertyBreakdown.length * 50)}>
                  <BarChart data={data.propertyBreakdown} layout="vertical" margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(1)}M`} />
                    <YAxis type="category" dataKey="address" tick={{ fontSize: 10 }} width={100} />
                    <Tooltip formatter={(value: number) => `${fmt(value)} kr`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="currentValue" name="Verdi" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} />
                    <Bar dataKey="loanAmount" name="Lån" fill="hsl(var(--destructive, 0 84% 60%))" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Per-property cards */}
          {data.propertyBreakdown.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Ingen eiendommer registrert</p>
              </CardContent>
            </Card>
          ) : (
            data.propertyBreakdown.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between mb-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{p.address}</h3>
                      {p.city && <p className="text-xs text-muted-foreground">{p.city}</p>}
                    </div>
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      {p.hasTenant ? (
                        <Badge className="bg-green-100 text-green-800 text-[10px]">Utleid</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Ledig</Badge>
                      )}
                    </div>
                  </div>

                  {/* Value / Equity / LTV */}
                  <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                    <div>
                      <span className="text-muted-foreground">Verdi</span>
                      <p className="font-semibold">{fmt(p.currentValue)} kr</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Egenkapital</span>
                      <p className="font-semibold text-green-600">{fmt(p.equity)} kr</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Belåning</span>
                      <p className="font-semibold">{p.currentValue > 0 ? ((p.loanAmount / p.currentValue) * 100).toFixed(0) : 0}%</p>
                    </div>
                  </div>

                  {/* Financial details */}
                  <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                    <div>
                      <span className="text-muted-foreground">Mnd. leie</span>
                      <p className="font-medium">{fmt(p.monthlyRent)} kr</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mnd. kost</span>
                      <p className="font-medium">{fmt(p.monthlyCost)} kr</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pengestrøm</span>
                      <p className={`font-bold ${p.cashflow >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {p.cashflow >= 0 ? "+" : ""}{fmt(p.cashflow)} kr
                      </p>
                    </div>
                  </div>

                  {/* Yield & Appreciation */}
                  <div className="flex gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <Percent className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Avk:</span>
                      <span className="font-semibold">{p.yieldPct}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Verdiøkning:</span>
                      <span className={`font-semibold ${p.appreciation >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {p.appreciation >= 0 ? "+" : ""}{p.appreciation.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Home className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Rente:</span>
                      <span className="font-semibold">{p.interestRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
};

/* ── Sub-components ──────────────────────────────────── */
function KPI({ icon, label, value, positive }: { icon: React.ReactNode; label: string; value: string; positive?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className={positive ? "text-primary" : "text-muted-foreground"}>{icon}</span>
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
        </div>
        <p className={`text-lg font-bold ${positive === false ? "text-destructive" : ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function MiniKPI({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-3 text-center">
        <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
        <p className="text-base font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function ValueRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${color}`}>{fmt(value)} kr</span>
    </div>
  );
}

export default AdminDashboard;
