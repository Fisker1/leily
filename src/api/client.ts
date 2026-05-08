// ─── Leily API Client ───────────────────────────────────
// Single source of truth for all API calls. No Supabase.

const API_URL = import.meta.env.VITE_API_URL || "/api";

function getToken(): string | null {
  return localStorage.getItem("leily_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("leily_token");
    localStorage.removeItem("leily_user");
    window.location.href = "/auth";
    throw new Error("Ikke autentisert");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Feil: ${res.status}`);
  }

  return res.json();
}

// ─── Auth ────────────────────────────────────────────────
export const auth = {
  async login(email: string, password: string) {
    const data = await request<{ user: User; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("leily_token", data.token);
    localStorage.setItem("leily_user", JSON.stringify(data.user));
    return data;
  },

  async register(email: string, password: string, full_name?: string) {
    const data = await request<{ user: User; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name }),
    });
    localStorage.setItem("leily_token", data.token);
    localStorage.setItem("leily_user", JSON.stringify(data.user));
    return data;
  },

  async me() {
    return request<{ user: User }>("/auth/me");
  },

  logout() {
    localStorage.removeItem("leily_token");
    localStorage.removeItem("leily_user");
    window.location.href = "/auth";
  },

  getUser(): User | null {
    try {
      const raw = localStorage.getItem("leily_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  isLoggedIn(): boolean {
    return !!getToken();
  },
};

// ─── Dashboard ──────────────────────────────────────────
export const dashboard = {
  stats: () => request<DashboardStats>("/dashboard"),
};

// ─── Properties ─────────────────────────────────────────
export const properties = {
  list: () => request<Property[]>("/properties"),
  get: (id: string) => request<Property>(`/properties/${id}`),
  create: (data: Partial<Property>) => request<Property>("/properties", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Property>) => request<Property>(`/properties/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => request<{ ok: boolean }>(`/properties/${id}`, { method: "DELETE" }),
};

// ─── Leases ─────────────────────────────────────────────
export const leases = {
  list: () => request<Lease[]>("/leases"),
  create: (data: CreateLeaseData) => request<Lease>("/leases", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Lease>) => request<Lease>(`/leases/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  terminate: (id: string) => request<Lease>(`/leases/${id}/terminate`, { method: "POST" }),
};

// ─── Tenants ────────────────────────────────────────────
export const tenants = {
  list: () => request<Tenant[]>("/tenants"),
  create: (data: Partial<Tenant>) => request<Tenant>("/tenants", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Tenant>) => request<Tenant>(`/tenants/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => request<{ ok: boolean }>(`/tenants/${id}`, { method: "DELETE" }),
};

// ─── Finance ────────────────────────────────────────────
export const finance = {
  overview: () => request<FinanceOverview>("/finance/overview"),
  transactions: (limit?: number) => request<Transaction[]>(`/finance/transactions${limit ? `?limit=${limit}` : ""}`),
  addTransaction: (data: Partial<Transaction>) => request<Transaction>("/finance/transactions", { method: "POST", body: JSON.stringify(data) }),
  removeTransaction: (id: string) => request<{ ok: boolean }>(`/finance/transactions/${id}`, { method: "DELETE" }),
};

// ─── Admin Dashboard ────────────────────────────────────
export const adminDashboard = {
  /** Aggregated stats for admin overview */
  summary: async (): Promise<AdminSummary> => {
    const [statsData, finData, txData] = await Promise.all([
      dashboard.stats(),
      finance.overview(),
      finance.transactions(200),
    ]);
    return buildAdminSummary(statsData, finData, txData);
  },
};

function buildAdminSummary(
  stats: DashboardStats,
  fin: FinanceOverview,
  txs: Transaction[]
): AdminSummary {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Group transactions by month (last 12 months)
  const monthlyMap: Record<string, { income: number; expense: number }> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap[key] = { income: 0, expense: 0 };
  }
  for (const tx of txs) {
    const key = tx.date?.slice(0, 7);
    if (key && monthlyMap[key] !== undefined) {
      if (tx.type === "income") monthlyMap[key].income += tx.amount;
      else monthlyMap[key].expense += tx.amount;
    }
  }
  const monthlyTrend: MonthlyDataPoint[] = Object.entries(monthlyMap).map(
    ([month, v]) => ({ month, income: v.income, expense: v.expense, net: v.income - v.expense })
  );

  // Expense breakdown by category (current month)
  const catMap: Record<string, number> = {};
  for (const tx of txs) {
    if (tx.type === "expense" && tx.date?.startsWith(thisMonth)) {
      catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount;
    }
  }
  const expenseByCategory: CategoryBreakdown[] = Object.entries(catMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Property-level data
  const propertyBreakdown: PropertyFinance[] = fin.properties.map((p) => ({
    id: p.id,
    address: p.address,
    city: p.city,
    currentValue: p.current_value,
    purchasePrice: p.purchase_price,
    loanAmount: p.loan_amount,
    equity: p.current_value - p.loan_amount,
    monthlyRent: p.monthly_rent,
    monthlyCost: p.monthly_cost,
    cashflow: p.cashflow,
    yieldPct: p.yield_pct,
    interestRate: p.interest_rate,
    hasTenant: p.has_tenant,
    appreciation: p.purchase_price > 0 ? ((p.current_value - p.purchase_price) / p.purchase_price) * 100 : 0,
  }));

  // Recent transactions
  const recentTransactions = txs.slice(0, 20);

  return {
    kpis: {
      totalPortfolioValue: stats.totalValue,
      totalLoan: stats.totalLoan,
      totalEquity: stats.equity,
      monthlyIncome: stats.monthlyIncome,
      monthlyCosts: fin.totals.costs,
      monthlyCashflow: fin.totals.cashflow,
      properties: stats.properties,
      tenants: stats.tenants,
      occupancy: stats.occupancy,
      avgYield: fin.totals.avg_yield,
    },
    monthlyTrend,
    expenseByCategory,
    propertyBreakdown,
    recentTransactions,
    expiringLeases: stats.expiringLeases,
  };
}

// ─── Messages ───────────────────────────────────────────
export const messages = {
  list: (leaseId: string) => request<Message[]>(`/messages/${leaseId}`),
  send: (leaseId: string, content: string) => request<Message>(`/messages/${leaseId}`, { method: "POST", body: JSON.stringify({ content, sender: "landlord" }) }),
};

// ─── Types ──────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  full_name?: string;
}

export interface Property {
  id: string;
  address: string;
  city?: string;
  postal_code?: string;
  property_type?: string;
  size_sqm?: number;
  bedrooms?: number;
  purchase_price?: number;
  current_value?: number;
  loan_amount?: number;
  interest_rate?: number;
  monthly_rent?: number;
  image_url?: string;
  notes?: string;
  created_at?: string;
  active_lease?: {
    id: string;
    tenant_id: string;
    monthly_rent: number;
    start_date: string;
    end_date: string;
    tenant_name: string;
  } | null;
}

export interface Lease {
  id: string;
  property_id: string;
  tenant_id: string;
  monthly_rent: number;
  deposit?: number;
  start_date: string;
  end_date: string;
  status: string;
  notes?: string;
  property_address?: string;
  property_city?: string;
  tenant_name?: string;
  created_at?: string;
}

export interface CreateLeaseData {
  property_id: string;
  tenant_id?: string;
  tenant_first_name?: string;
  tenant_last_name?: string;
  tenant_email?: string;
  tenant_phone?: string;
  monthly_rent: number;
  deposit?: number;
  start_date: string;
  end_date: string;
  notes?: string;
}

export interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  created_at?: string;
}

export interface Transaction {
  id: string;
  property_id?: string;
  lease_id?: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description?: string;
  date: string;
}

export interface Message {
  id: string;
  lease_id: string;
  sender: "landlord" | "tenant";
  content: string;
  created_at: string;
}

export interface DashboardStats {
  properties: number;
  tenants: number;
  activeLeases: number;
  monthlyIncome: number;
  totalValue: number;
  totalLoan: number;
  equity: number;
  occupancy: number;
  avgYield: number;
  expiringLeases: Array<{
    id: string;
    end_date: string;
    property_address: string;
    tenant_name: string;
  }>;
}

export interface FinanceOverview {
  properties: Array<{
    id: string;
    address: string;
    city?: string;
    monthly_rent: number;
    monthly_cost: number;
    cashflow: number;
    purchase_price: number;
    current_value: number;
    loan_amount: number;
    interest_rate: number;
    yield_pct: number;
    has_tenant: boolean;
  }>;
  totals: {
    income: number;
    costs: number;
    cashflow: number;
    portfolio_value: number;
    total_loan: number;
    avg_yield: number;
  };
}

// ─── Admin Dashboard Types ──────────────────────────────
export interface AdminSummary {
  kpis: {
    totalPortfolioValue: number;
    totalLoan: number;
    totalEquity: number;
    monthlyIncome: number;
    monthlyCosts: number;
    monthlyCashflow: number;
    properties: number;
    tenants: number;
    occupancy: number;
    avgYield: number;
  };
  monthlyTrend: MonthlyDataPoint[];
  expenseByCategory: CategoryBreakdown[];
  propertyBreakdown: PropertyFinance[];
  recentTransactions: Transaction[];
  expiringLeases: Array<{
    id: string;
    end_date: string;
    property_address: string;
    tenant_name: string;
  }>;
}

export interface MonthlyDataPoint {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
}

export interface PropertyFinance {
  id: string;
  address: string;
  city?: string;
  currentValue: number;
  purchasePrice: number;
  loanAmount: number;
  equity: number;
  monthlyRent: number;
  monthlyCost: number;
  cashflow: number;
  yieldPct: number;
  interestRate: number;
  hasTenant: boolean;
  appreciation: number;
}
