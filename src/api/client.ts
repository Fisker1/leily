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
  created_at?: string;
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

