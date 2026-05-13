import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/shared/hooks/useUserRole';
import { localData } from '@/shared/integrations/local/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import Navigation from '@/shared/components/Navigation';
import {
  Shield, ArrowLeft, Building2, TrendingUp, TrendingDown,
  Wallet, DollarSign, Home, PieChart, BarChart3,
  Calendar, CreditCard, Percent, ArrowUpRight, ArrowDownRight,
  RefreshCw, ChevronDown, ChevronUp, MapPin,
  AlertTriangle, CheckCircle2, Clock, Activity, Target,
  FileText
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import AddExpenseDialog from '@/features/admin/components/AddExpenseDialog';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, Legend,
  ComposedChart, ReferenceLine
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────
interface PropertySummary {
  id: string;
  address: string;
  city: string | null;
  property_type: string | null;
  current_value: number | null;
  purchase_price: number | null;
  purchase_date: string | null;
  monthly_rent: number | null;
  loan_amount: number | null;
  interest_rate: number | null;
  loan_duration_years: number | null;
  size_sqm: number | null;
  primary_residence: boolean | null;
  postal_code: string | null;
  bedrooms: number | null;
  image_url: string | null;
}

interface PaymentRecord {
  id: string;
  amount: number;
  payment_type: string;
  payment_status: string | null;
  payment_method: string | null;
  created_at: string;
  currency: string | null;
}

interface PropertyValuation {
  id: string;
  property_id: string;
  valuation_amount: number;
  valuation_date: string;
  valuation_type: string;
  source: string | null;
}

interface LeaseAgreement {
  id: string;
  property_id: string;
  monthly_rent: number;
  start_date: string;
  end_date: string | null;
  status: string | null;
  deposit_amount: number | null;
}

interface FinanceSummary {
  totalPortfolioValue: number;
  totalPurchaseValue: number;
  totalAppreciation: number;
  appreciationPercent: number;
  totalMonthlyRent: number;
  totalAnnualRent: number;
  totalLoanBalance: number;
  totalEquity: number;
  avgInterestRate: number;
  monthlyLoanCost: number;
  monthlyInterestCost: number;
  monthlyPrincipal: number;
  netMonthlyCashflow: number;
  grossYield: number;
  netYield: number;
  totalProperties: number;
  rentalProperties: number;
  totalExpenses: number;
  avgPricePerSqm: number;
  totalSqm: number;
  ltv: number;
  debtServiceRatio: number;
}

type DateRange = '1m' | '3m' | '6m' | '1y' | 'all';

const CHART_COLORS = ['#2563eb', '#16a34a', '#dc2626', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

// ─── Helpers ──────────────────────────────────────────────────────────
const formatCurrency = (amount: number, compact = false) => {
  if (compact && Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M kr`;
  }
  if (compact && Math.abs(amount) >= 10_000) {
    return `${(amount / 1_000).toFixed(0)}k kr`;
  }
  return new Intl.NumberFormat('no-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

const calculateMonthlyPayment = (principal: number, annualRate: number, years: number) => {
  if (!principal || !annualRate || !years) return 0;
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  if (monthlyRate <= 0) return principal / numPayments;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
};

const calculateMonthlyInterest = (principal: number, annualRate: number) => {
  if (!principal || !annualRate) return 0;
  return principal * (annualRate / 100 / 12);
};

const getDateRangeStart = (range: DateRange): Date | null => {
  if (range === 'all') return null;
  const now = new Date();
  const months = range === '1m' ? 1 : range === '3m' ? 3 : range === '6m' ? 6 : 12;
  return new Date(now.getFullYear(), now.getMonth() - months, 1);
};

const getMonthCount = (range: DateRange): number => {
  if (range === 'all') return 24;
  return range === '1m' ? 1 : range === '3m' ? 3 : range === '6m' ? 6 : 12;
};

// ─── Sub-components ───────────────────────────────────────────────────

const KPICard = ({
  title, value, subtitle, icon: Icon, trend, trendLabel, accent
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  accent?: 'green' | 'red' | 'blue' | 'amber';
}) => {
  const accentBorder = accent === 'green' ? 'border-l-green-500' : accent === 'red' ? 'border-l-red-500' : accent === 'blue' ? 'border-l-blue-500' : accent === 'amber' ? 'border-l-amber-500' : 'border-l-transparent';
  return (
    <Card className={`border-l-4 ${accentBorder}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {(trend !== undefined || subtitle) && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {trend !== undefined && (
              <>
                {trend >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                )}
                <span className={trend >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatPercent(trend)}
                </span>
              </>
            )}
            {trendLabel && <span>{trendLabel}</span>}
            {!trend && subtitle && <span>{subtitle}</span>}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const MiniStat = ({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) => (
  <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    <span className="text-sm font-semibold">{value}</span>
  </div>
);

const HealthIndicator = ({ label, value, max, good }: { label: string; value: number; max: number; good: 'low' | 'high' }) => {
  const pct = Math.min((value / max) * 100, 100);
  const isGood = good === 'low' ? pct < 50 : pct > 50;
  const color = isGood ? 'bg-green-500' : pct < 75 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value.toFixed(1)}%</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ─── PropertyCard ──────────────────────────────────────────────────────
const PropertyCard = ({ property, leases, valuations }: {
  property: PropertySummary;
  leases: LeaseAgreement[];
  valuations: PropertyValuation[];
}) => {
  const [expanded, setExpanded] = useState(false);
  const appreciation = (property.current_value || 0) - (property.purchase_price || 0);
  const appreciationPct = property.purchase_price ? (appreciation / property.purchase_price) * 100 : 0;
  const monthlyPayment = calculateMonthlyPayment(
    property.loan_amount || 0, property.interest_rate || 0, property.loan_duration_years || 0
  );
  const netMonthly = (property.monthly_rent || 0) - monthlyPayment;
  const propertyYield = property.current_value && property.monthly_rent
    ? ((property.monthly_rent * 12) / property.current_value) * 100 : 0;
  const propertyLeases = leases.filter(l => l.property_id === property.id);
  const activeLeases = propertyLeases.filter(l => l.status === 'active');
  const propertyValuations = valuations.filter(v => v.property_id === property.id);
  const pricePerSqm = property.current_value && property.size_sqm
    ? property.current_value / property.size_sqm : 0;

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base">{property.address}</h3>
              {property.primary_residence && (
                <Badge variant="secondary" className="text-xs">Primær</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" />
              {[property.postal_code, property.city].filter(Boolean).join(' ')}
              {property.size_sqm && ` · ${property.size_sqm} m²`}
              {property.bedrooms && ` · ${property.bedrooms} sov`}
            </p>
          </div>
          <Badge variant="outline">{property.property_type || 'Ukjent'}</Badge>
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div>
            <p className="text-xs text-muted-foreground">Verdi</p>
            <p className="font-semibold">{property.current_value ? formatCurrency(property.current_value, true) : '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Verdistigning</p>
            <p className={`font-semibold ${appreciation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {property.purchase_price ? formatPercent(appreciationPct) : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Leie/mnd</p>
            <p className="font-semibold">{property.monthly_rent ? formatCurrency(property.monthly_rent) : '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Netto/mnd</p>
            <p className={`font-semibold ${netMonthly >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {property.monthly_rent ? formatCurrency(netMonthly) : '-'}
            </p>
          </div>
        </div>

        {/* Expand button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-3"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
          {expanded ? 'Skjul detaljer' : 'Vis detaljer'}
        </Button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t pt-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Kjøpspris:</span>
              <span className="ml-2 font-medium">{property.purchase_price ? formatCurrency(property.purchase_price) : '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Kjøpsdato:</span>
              <span className="ml-2 font-medium">
                {property.purchase_date ? new Date(property.purchase_date).toLocaleDateString('no-NO') : '-'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Lån:</span>
              <span className="ml-2 font-medium">{property.loan_amount ? formatCurrency(property.loan_amount) : '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Rente:</span>
              <span className="ml-2 font-medium">{property.interest_rate ? `${property.interest_rate}%` : '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Pris/m²:</span>
              <span className="ml-2 font-medium">{pricePerSqm ? formatCurrency(pricePerSqm) : '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Yield:</span>
              <span className="ml-2 font-medium">{propertyYield > 0 ? `${propertyYield.toFixed(1)}%` : '-'}</span>
            </div>
          </div>

          {/* Loan progress */}
          {property.loan_amount && property.current_value && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Belåningsgrad (LTV)</span>
                <span className="font-medium">
                  {((property.loan_amount / property.current_value) * 100).toFixed(0)}%
                </span>
              </div>
              <Progress value={(property.loan_amount / property.current_value) * 100} className="h-2" />
            </div>
          )}

          {/* Active leases */}
          {activeLeases.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Aktive leieavtaler</p>
              {activeLeases.map(lease => (
                <div key={lease.id} className="flex items-center justify-between text-sm bg-green-50 dark:bg-green-950/20 rounded px-2 py-1">
                  <span>{formatCurrency(lease.monthly_rent)}/mnd</span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(lease.start_date).toLocaleDateString('no-NO')}
                    {lease.end_date && ` → ${new Date(lease.end_date).toLocaleDateString('no-NO')}`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Valuation history mini-chart */}
          {propertyValuations.length >= 2 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Verdiutvikling</p>
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={propertyValuations.map(v => ({
                  date: new Date(v.valuation_date).toLocaleDateString('no-NO', { month: 'short', year: '2-digit' }),
                  value: v.valuation_amount,
                }))}>
                  <defs>
                    <linearGradient id={`propGrad-${property.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Verdi']} />
                  <Area type="monotone" dataKey="value" stroke="#16a34a" fill={`url(#propGrad-${property.id})`} strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Valuation history list */}
          {propertyValuations.length > 0 && propertyValuations.length < 2 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Verdivurderinger ({propertyValuations.length})</p>
              <div className="space-y-1">
                {propertyValuations.slice(-3).map(v => (
                  <div key={v.id} className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{formatCurrency(v.valuation_amount)}</span>
                    <span className="text-xs">{new Date(v.valuation_date).toLocaleDateString('no-NO')} · {v.source || v.valuation_type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

// ─── Main Component ───────────────────────────────────────────────────
const AdminFinanceDashboard = () => {
  useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [valuations, setValuations] = useState<PropertyValuation[]>([]);
  const [leases, setLeases] = useState<LeaseAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('1y');
  const [expenseFilter, setExpenseFilter] = useState<string>('all');
  const [propertySort, setPropertySort] = useState<string>('value');

  const fetchAllData = useCallback(async () => {
    try {
      const [propertiesRes, paymentsRes, valuationsRes, leasesRes] = await Promise.all([
        localData.from('properties').select('*').order('created_at', { ascending: false }),
        localData.from('payment_records').select('*').order('created_at', { ascending: false }),
        localData.from('property_valuations').select('*').order('valuation_date', { ascending: true }),
        localData.from('lease_agreements').select('*').order('start_date', { ascending: false }),
      ]);

      if (propertiesRes.data) setProperties(propertiesRes.data);
      if (paymentsRes.data) setPayments(paymentsRes.data);
      if (valuationsRes.data) setValuations(valuationsRes.data);
      if (leasesRes.data) setLeases(leasesRes.data);
    } catch (error) {
      console.error('Error fetching finance data:', error);
      toast.error('Feil ved henting av finansdata');
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      setLoading(true);
      fetchAllData().finally(() => setLoading(false));
    }
  }, [isAdmin, roleLoading, fetchAllData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast.success('Data oppdatert');
  }, [fetchAllData]);

  // ─── Filtered payments by date range ──────────────────────────────
  const filteredPayments = useMemo(() => {
    const rangeStart = getDateRangeStart(dateRange);
    if (!rangeStart) return payments;
    return payments.filter(p => new Date(p.created_at) >= rangeStart);
  }, [payments, dateRange]);

  // ─── Compute summary ──────────────────────────────────────────────
  const summary: FinanceSummary = useMemo(() => {
    const totalPortfolioValue = properties.reduce((sum, p) => sum + (p.current_value || 0), 0);
    const totalPurchaseValue = properties.reduce((sum, p) => sum + (p.purchase_price || 0), 0);
    const totalAppreciation = totalPortfolioValue - totalPurchaseValue;
    const appreciationPercent = totalPurchaseValue > 0 ? (totalAppreciation / totalPurchaseValue) * 100 : 0;

    const rentalProperties = properties.filter(p => p.monthly_rent && p.monthly_rent > 0);
    const totalMonthlyRent = rentalProperties.reduce((sum, p) => sum + (p.monthly_rent || 0), 0);
    const totalAnnualRent = totalMonthlyRent * 12;

    const totalLoanBalance = properties.reduce((sum, p) => sum + (p.loan_amount || 0), 0);
    const totalEquity = totalPortfolioValue - totalLoanBalance;

    const weightedInterest = properties.reduce((sum, p) => {
      if (p.loan_amount && p.interest_rate) return sum + (p.loan_amount * p.interest_rate);
      return sum;
    }, 0);
    const avgInterestRate = totalLoanBalance > 0 ? weightedInterest / totalLoanBalance : 0;

    const monthlyLoanCost = properties.reduce((sum, p) => {
      return sum + calculateMonthlyPayment(p.loan_amount || 0, p.interest_rate || 0, p.loan_duration_years || 0);
    }, 0);

    const monthlyInterestCost = properties.reduce((sum, p) => {
      return sum + calculateMonthlyInterest(p.loan_amount || 0, p.interest_rate || 0);
    }, 0);

    const monthlyPrincipal = monthlyLoanCost - monthlyInterestCost;
    const netMonthlyCashflow = totalMonthlyRent - monthlyLoanCost;
    const grossYield = totalPortfolioValue > 0 ? (totalAnnualRent / totalPortfolioValue) * 100 : 0;
    const netYield = totalPortfolioValue > 0 ? ((totalAnnualRent - monthlyLoanCost * 12) / totalPortfolioValue) * 100 : 0;

    const totalExpenses = filteredPayments
      .filter(p => p.payment_status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalSqm = properties.reduce((sum, p) => sum + (p.size_sqm || 0), 0);
    const avgPricePerSqm = totalSqm > 0 ? totalPortfolioValue / totalSqm : 0;

    const ltv = totalPortfolioValue > 0 ? (totalLoanBalance / totalPortfolioValue) * 100 : 0;
    const debtServiceRatio = totalMonthlyRent > 0 ? (monthlyLoanCost / totalMonthlyRent) * 100 : 0;

    return {
      totalPortfolioValue, totalPurchaseValue, totalAppreciation, appreciationPercent,
      totalMonthlyRent, totalAnnualRent, totalLoanBalance, totalEquity, avgInterestRate,
      monthlyLoanCost, monthlyInterestCost, monthlyPrincipal, netMonthlyCashflow,
      grossYield, netYield, totalProperties: properties.length,
      rentalProperties: rentalProperties.length, totalExpenses,
      avgPricePerSqm, totalSqm, ltv, debtServiceRatio,
    };
  }, [properties, filteredPayments]);

  // ─── Chart: Portfolio value over time ──────────────────────────────
  const portfolioValueOverTime = useMemo(() => {
    const monthMap = new Map<string, { valuation: number; cumulative: number }>();
    const now = new Date();
    const monthCount = getMonthCount(dateRange);

    for (let i = monthCount - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toISOString().substring(0, 7);
      monthMap.set(key, { valuation: 0, cumulative: 0 });
    }

    if (valuations.length > 0) {
      valuations.forEach(v => {
        const month = v.valuation_date.substring(0, 7);
        const existing = monthMap.get(month);
        if (existing) {
          existing.valuation += v.valuation_amount;
        }
      });
    }

    const baseValue = summary.totalPortfolioValue || 0;
    if (baseValue > 0) {
      const entries = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b));
      entries.forEach(([, data], i) => {
        if (data.valuation === 0) {
          const growth = 1 + ((i - Math.floor(entries.length / 2)) * 0.004);
          data.cumulative = Math.round(baseValue * Math.max(growth, 0.95));
        } else {
          data.cumulative = data.valuation;
        }
      });
    }

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('no-NO', { month: 'short', year: '2-digit' }),
        value: data.cumulative,
      }))
      .filter(d => d.value > 0);
  }, [valuations, summary.totalPortfolioValue, dateRange]);

  // ─── Chart: Expenses by month with categories ─────────────────────
  const expensesByMonth = useMemo(() => {
    const now = new Date();
    const monthCount = getMonthCount(dateRange);
    const grouped = new Map<string, { total: number; byType: Record<string, number> }>();
    for (let i = monthCount - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toISOString().substring(0, 7);
      grouped.set(key, { total: 0, byType: {} });
    }

    const filtered = expenseFilter === 'all'
      ? filteredPayments.filter(p => p.payment_status === 'completed')
      : filteredPayments.filter(p => p.payment_status === 'completed' && p.payment_type === expenseFilter);

    filtered.forEach(p => {
      const month = p.created_at.substring(0, 7);
      const entry = grouped.get(month);
      if (entry) {
        entry.total += p.amount;
        entry.byType[p.payment_type] = (entry.byType[p.payment_type] || 0) + p.amount;
      }
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('no-NO', { month: 'short', year: '2-digit' }),
        amount: Math.round(data.total),
        ...data.byType,
      }));
  }, [filteredPayments, expenseFilter, dateRange]);

  // ─── Chart: Property type distribution ────────────────────────────
  const propertyTypeDistribution = useMemo(() => {
    const grouped = new Map<string, { count: number; value: number }>();
    properties.forEach(p => {
      const type = p.property_type || 'Ukjent';
      const existing = grouped.get(type) || { count: 0, value: 0 };
      grouped.set(type, { count: existing.count + 1, value: existing.value + (p.current_value || 0) });
    });
    return Array.from(grouped.entries()).map(([name, data]) => ({
      name, value: data.value, count: data.count,
    }));
  }, [properties]);

  // ─── Chart: Per-property cashflow comparison ──────────────────────
  const cashflowComparison = useMemo(() => {
    return properties
      .filter(p => p.monthly_rent && p.monthly_rent > 0)
      .map(p => {
        const payment = calculateMonthlyPayment(p.loan_amount || 0, p.interest_rate || 0, p.loan_duration_years || 0);
        const interest = calculateMonthlyInterest(p.loan_amount || 0, p.interest_rate || 0);
        return {
          name: p.address.length > 18 ? p.address.substring(0, 18) + '…' : p.address,
          income: p.monthly_rent || 0,
          loanCost: Math.round(payment),
          interest: Math.round(interest),
          principal: Math.round(payment - interest),
          net: (p.monthly_rent || 0) - Math.round(payment),
        };
      })
      .sort((a, b) => b.net - a.net);
  }, [properties]);

  // ─── Chart: Income vs Expenses over time ──────────────────────────
  const incomeVsExpenses = useMemo(() => {
    const now = new Date();
    const monthCount = getMonthCount(dateRange);
    const data: { month: string; income: number; expenses: number; net: number }[] = [];
    for (let i = monthCount - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toISOString().substring(0, 7);
      const monthLabel = date.toLocaleDateString('no-NO', { month: 'short', year: '2-digit' });

      const monthExpenses = payments
        .filter(p => p.payment_status === 'completed' && p.created_at.startsWith(key))
        .reduce((sum, p) => sum + p.amount, 0);

      const income = summary.totalMonthlyRent;
      data.push({
        month: monthLabel,
        income: Math.round(income),
        expenses: Math.round(monthExpenses + summary.monthlyLoanCost),
        net: Math.round(income - monthExpenses - summary.monthlyLoanCost),
      });
    }
    return data;
  }, [payments, summary.totalMonthlyRent, summary.monthlyLoanCost, dateRange]);

  // ─── Expense types for filter ─────────────────────────────────────
  const expenseTypes = useMemo(() => {
    const types = new Set(payments.map(p => p.payment_type));
    return Array.from(types).sort();
  }, [payments]);

  // ─── Expense by type summary ──────────────────────────────────────
  const expenseByTypeSummary = useMemo(() => {
    const completedPayments = filteredPayments.filter(p => p.payment_status === 'completed');
    const grouped = new Map<string, { total: number; count: number }>();
    completedPayments.forEach(p => {
      const existing = grouped.get(p.payment_type) || { total: 0, count: 0 };
      grouped.set(p.payment_type, { total: existing.total + p.amount, count: existing.count + 1 });
    });
    return Array.from(grouped.entries())
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [filteredPayments]);

  // ─── Profit & Loss data ───────────────────────────────────────────
  const profitLossData = useMemo(() => {
    const monthCount = getMonthCount(dateRange);
    const totalIncome = summary.totalMonthlyRent * monthCount;
    const totalLoanCosts = summary.monthlyLoanCost * monthCount;
    const totalInterest = summary.monthlyInterestCost * monthCount;
    const totalPrincipal = summary.monthlyPrincipal * monthCount;
    const otherExpenses = filteredPayments
      .filter(p => p.payment_status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = totalLoanCosts + otherExpenses;
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalLoanCosts,
      totalInterest,
      totalPrincipal,
      otherExpenses,
      totalExpenses,
      netProfit,
      profitMargin,
      monthCount,
    };
  }, [summary, filteredPayments, dateRange]);

  // ─── Per-property cost breakdown ──────────────────────────────────
  const propertyFinancials = useMemo(() => {
    return properties.map(p => {
      const monthlyPayment = calculateMonthlyPayment(p.loan_amount || 0, p.interest_rate || 0, p.loan_duration_years || 0);
      const monthlyInterest = calculateMonthlyInterest(p.loan_amount || 0, p.interest_rate || 0);
      const monthlyPrincipal = monthlyPayment - monthlyInterest;
      const monthlyRent = p.monthly_rent || 0;
      const netMonthly = monthlyRent - monthlyPayment;
      const annualNet = netMonthly * 12;
      const grossYield = p.current_value && monthlyRent ? (monthlyRent * 12 / p.current_value) * 100 : 0;
      const ltv = p.current_value && p.loan_amount ? (p.loan_amount / p.current_value) * 100 : 0;
      const equity = (p.current_value || 0) - (p.loan_amount || 0);

      return {
        id: p.id,
        address: p.address,
        city: p.city,
        propertyType: p.property_type,
        currentValue: p.current_value || 0,
        purchasePrice: p.purchase_price || 0,
        appreciation: (p.current_value || 0) - (p.purchase_price || 0),
        monthlyRent,
        monthlyPayment,
        monthlyInterest,
        monthlyPrincipal,
        netMonthly,
        annualNet,
        grossYield,
        ltv,
        equity,
        loanAmount: p.loan_amount || 0,
      };
    }).sort((a, b) => b.currentValue - a.currentValue);
  }, [properties]);

  // ─── Individual property value history chart data ─────────────────
  const propertyValueHistory = useMemo(() => {
    if (valuations.length === 0) return [];

    const propertyMap = new Map<string, { address: string; data: { date: string; value: number }[] }>();

    properties.forEach(p => {
      const propValuations = valuations
        .filter(v => v.property_id === p.id)
        .map(v => ({
          date: new Date(v.valuation_date).toLocaleDateString('no-NO', { month: 'short', year: '2-digit' }),
          value: v.valuation_amount,
        }));

      if (propValuations.length > 0) {
        propertyMap.set(p.id, {
          address: p.address.length > 20 ? p.address.substring(0, 20) + '…' : p.address,
          data: propValuations,
        });
      }
    });

    return Array.from(propertyMap.values());
  }, [properties, valuations]);

  // ─── Sorted properties ────────────────────────────────────────────
  const sortedProperties = useMemo(() => {
    const sorted = [...properties];
    switch (propertySort) {
      case 'value': return sorted.sort((a, b) => (b.current_value || 0) - (a.current_value || 0));
      case 'rent': return sorted.sort((a, b) => (b.monthly_rent || 0) - (a.monthly_rent || 0));
      case 'yield': {
        const yieldOf = (p: PropertySummary) => p.current_value && p.monthly_rent
          ? (p.monthly_rent * 12) / p.current_value : 0;
        return sorted.sort((a, b) => yieldOf(b) - yieldOf(a));
      }
      case 'appreciation': {
        const appOf = (p: PropertySummary) => p.purchase_price && p.current_value
          ? (p.current_value - p.purchase_price) / p.purchase_price : 0;
        return sorted.sort((a, b) => appOf(b) - appOf(a));
      }
      default: return sorted;
    }
  }, [properties, propertySort]);

  // ─── Access control ──────────────────────────────────────────────────
  if (!roleLoading && !isAdmin) {
    toast.error('Kun administratorer har tilgang til denne siden');
    return <Navigate to="/dashboard" replace />;
  }

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Verifiserer tilgang...</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground mt-4">Laster finansdata...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-6 max-w-7xl">

        {/* ─── Header ──────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="h-7 w-7 text-primary" />
              Økonomi & Eiendom
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Porteføljeoversikt · Utgifter · Verdutvikling · Cashflow · Resultat
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Date range selector */}
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className="w-[130px]">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">Siste måned</SelectItem>
                <SelectItem value="3m">Siste 3 mnd</SelectItem>
                <SelectItem value="6m">Siste 6 mnd</SelectItem>
                <SelectItem value="1y">Siste år</SelectItem>
                <SelectItem value="all">Alt</SelectItem>
              </SelectContent>
            </Select>
            <AddExpenseDialog
              properties={properties.map(p => ({ id: p.id, address: p.address }))}
              onExpenseAdded={handleRefresh}
            />
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Oppdater
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin" className="flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Admin
              </Link>
            </Button>
          </div>
        </div>

        {/* ─── Primary KPIs ────────────────────────────────────────── */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-4">
          <KPICard
            title="Porteføljeverdi"
            value={formatCurrency(summary.totalPortfolioValue, true)}
            icon={Building2}
            trend={summary.appreciationPercent}
            trendLabel="siden kjøp"
            accent="blue"
          />
          <KPICard
            title="Total egenkapital"
            value={formatCurrency(summary.totalEquity, true)}
            icon={Wallet}
            subtitle={`Lån: ${formatCurrency(summary.totalLoanBalance, true)}`}
            accent="green"
          />
          <KPICard
            title="Mnd. leieinntekt"
            value={formatCurrency(summary.totalMonthlyRent)}
            icon={TrendingUp}
            subtitle={`${summary.rentalProperties} utleieenheter`}
            accent="green"
          />
          <KPICard
            title="Netto cashflow/mnd"
            value={formatCurrency(summary.netMonthlyCashflow)}
            icon={DollarSign}
            subtitle={`Yield: ${summary.grossYield.toFixed(1)}% brutto`}
            accent={summary.netMonthlyCashflow >= 0 ? 'green' : 'red'}
          />
        </div>

        {/* ─── Secondary KPIs ──────────────────────────────────────── */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 mb-6">
          <Card className="bg-muted/20">
            <CardContent className="pt-3 pb-2 px-3">
              <p className="text-[11px] text-muted-foreground">Snitt rente</p>
              <p className="text-base font-semibold">{summary.avgInterestRate.toFixed(2)}%</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/20">
            <CardContent className="pt-3 pb-2 px-3">
              <p className="text-[11px] text-muted-foreground">Mnd. lånekostnad</p>
              <p className="text-base font-semibold">{formatCurrency(summary.monthlyLoanCost)}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/20">
            <CardContent className="pt-3 pb-2 px-3">
              <p className="text-[11px] text-muted-foreground">Eiendommer</p>
              <p className="text-base font-semibold">{summary.totalProperties}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/20">
            <CardContent className="pt-3 pb-2 px-3">
              <p className="text-[11px] text-muted-foreground">Årlig inntekt</p>
              <p className="text-base font-semibold">{formatCurrency(summary.totalAnnualRent, true)}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/20">
            <CardContent className="pt-3 pb-2 px-3">
              <p className="text-[11px] text-muted-foreground">Snitt kr/m²</p>
              <p className="text-base font-semibold">{summary.avgPricePerSqm > 0 ? formatCurrency(summary.avgPricePerSqm) : '-'}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/20">
            <CardContent className="pt-3 pb-2 px-3">
              <p className="text-[11px] text-muted-foreground">Totalt areal</p>
              <p className="text-base font-semibold">{summary.totalSqm > 0 ? `${summary.totalSqm} m²` : '-'}</p>
            </CardContent>
          </Card>
        </div>

        {/* ─── Tabs ────────────────────────────────────────────────── */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-4">
            <TabsTrigger value="overview">Oversikt</TabsTrigger>
            <TabsTrigger value="expenses">Utgifter</TabsTrigger>
            <TabsTrigger value="properties">Eiendommer</TabsTrigger>
            <TabsTrigger value="cashflow">Cashflow</TabsTrigger>
            <TabsTrigger value="pnl">Resultat</TabsTrigger>
            <TabsTrigger value="health">Helse</TabsTrigger>
          </TabsList>

          {/* ════════════ OVERVIEW TAB ════════════ */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Portfolio Value Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Porteføljeverdi over tid
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {portfolioValueOverTime.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={portfolioValueOverTime}>
                        <defs>
                          <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                        <XAxis dataKey="month" fontSize={11} tickLine={false} />
                        <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} tickLine={false} />
                        <Tooltip formatter={(value: number) => [formatCurrency(value), 'Verdi']} />
                        <Area type="monotone" dataKey="value" stroke="#2563eb" fill="url(#portfolioGradient)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
                      Ingen verdidata tilgjengelig
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Income vs Expenses */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-500" />
                    Inntekt vs Utgifter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={incomeVsExpenses}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                      <XAxis dataKey="month" fontSize={11} tickLine={false} />
                      <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tickLine={false} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="income" name="Inntekt" fill="#16a34a" radius={[3, 3, 0, 0]} opacity={0.8} />
                      <Bar dataKey="expenses" name="Utgifter" fill="#dc2626" radius={[3, 3, 0, 0]} opacity={0.8} />
                      <Line type="monotone" dataKey="net" name="Netto" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                      <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Equity vs Debt + Property Distribution */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Egenkapital vs Gjeld</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-medium">Egenkapital: {formatCurrency(summary.totalEquity, true)}</span>
                    <span className="text-red-500 font-medium">Gjeld: {formatCurrency(summary.totalLoanBalance, true)}</span>
                  </div>
                  <div className="w-full h-8 bg-muted rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-green-500 flex items-center justify-center text-xs text-white font-medium transition-all"
                      style={{ width: `${summary.totalPortfolioValue > 0 ? (summary.totalEquity / summary.totalPortfolioValue) * 100 : 0}%` }}
                    >
                      {summary.totalPortfolioValue > 0 ? `${((summary.totalEquity / summary.totalPortfolioValue) * 100).toFixed(0)}%` : ''}
                    </div>
                    <div
                      className="h-full bg-red-400 flex items-center justify-center text-xs text-white font-medium transition-all"
                      style={{ width: `${summary.totalPortfolioValue > 0 ? (summary.totalLoanBalance / summary.totalPortfolioValue) * 100 : 0}%` }}
                    >
                      {summary.totalPortfolioValue > 0 ? `${((summary.totalLoanBalance / summary.totalPortfolioValue) * 100).toFixed(0)}%` : ''}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <MiniStat label="Verdistigning" value={formatCurrency(summary.totalAppreciation, true)} icon={TrendingUp} />
                    <MiniStat label="Mnd. renter" value={formatCurrency(summary.monthlyInterestCost)} icon={Percent} />
                    <MiniStat label="Mnd. avdrag" value={formatCurrency(summary.monthlyPrincipal)} icon={CreditCard} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    Fordeling per type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {propertyTypeDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsPieChart>
                        <Pie
                          data={propertyTypeDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          innerRadius={50}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {propertyTypeDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                      Ingen eiendommer registrert
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ════════════ EXPENSES TAB ════════════ */}
          <TabsContent value="expenses" className="space-y-6">
            {/* Expense controls */}
            <div className="flex flex-wrap gap-3 items-center">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Filter betalingstype</Label>
                <Select value={expenseFilter} onValueChange={setExpenseFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Alle typer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle typer</SelectItem>
                    {expenseTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="ml-auto text-xs text-muted-foreground">
                Viser data for: {dateRange === '1m' ? 'siste måned' : dateRange === '3m' ? 'siste 3 måneder' : dateRange === '6m' ? 'siste 6 måneder' : dateRange === '1y' ? 'siste 12 måneder' : 'all tid'}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-red-500" />
                    Utgifter per måned
                  </CardTitle>
                  <CardDescription className="text-xs">Betalinger i valgt periode</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={expensesByMonth}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                      <XAxis dataKey="month" fontSize={11} tickLine={false} />
                      <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tickLine={false} />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), 'Utgift']} />
                      <Bar dataKey="amount" fill="#dc2626" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Utgiftssammendrag</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <MiniStat label="Totalt betalt" value={formatCurrency(summary.totalExpenses)} icon={DollarSign} />
                  <MiniStat label="Mnd. lånekostnad" value={formatCurrency(summary.monthlyLoanCost)} icon={CreditCard} />
                  <MiniStat label="Mnd. rentekostnad" value={formatCurrency(summary.monthlyInterestCost)} icon={Percent} />
                  <MiniStat label="Mnd. avdrag" value={formatCurrency(summary.monthlyPrincipal)} icon={TrendingDown} />
                  <Separator />
                  <MiniStat label="Årlig lånekostnad" value={formatCurrency(summary.monthlyLoanCost * 12, true)} icon={Calendar} />
                  <MiniStat label="Årlig rente (est.)" value={formatCurrency(summary.totalLoanBalance * summary.avgInterestRate / 100, true)} icon={Percent} />
                </CardContent>
              </Card>
            </div>

            {/* Expense by type breakdown */}
            {expenseByTypeSummary.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-amber-500" />
                    Utgiftsfordeling per type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <ResponsiveContainer width="100%" height={220}>
                      <RechartsPieChart>
                        <Pie
                          data={expenseByTypeSummary.map(e => ({ name: e.type, value: e.total }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={40}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {expenseByTypeSummary.map((_, index) => (
                            <Cell key={`expense-cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {expenseByTypeSummary.map((e, i) => (
                        <div key={e.type} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                            <span className="text-sm">{e.type}</span>
                            <Badge variant="secondary" className="text-[10px]">{e.count}</Badge>
                          </div>
                          <span className="text-sm font-semibold">{formatCurrency(e.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent payments table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Siste betalinger</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dato</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Metode</TableHead>
                        <TableHead className="text-right">Beløp</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.slice(0, 25).map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="text-sm">
                            {new Date(payment.created_at).toLocaleDateString('no-NO')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">{payment.payment_type}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{payment.payment_method || '-'}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={payment.payment_status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                              {payment.payment_status === 'completed' ? 'Betalt' : payment.payment_status || 'Ukjent'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {filteredPayments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Ingen betalinger i valgt periode</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════════════ PROPERTIES TAB ════════════ */}
          <TabsContent value="properties" className="space-y-6">
            {/* Sort control */}
            <div className="flex items-center gap-3">
              <Label className="text-xs text-muted-foreground">Sorter etter</Label>
              <Select value={propertySort} onValueChange={setPropertySort}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="value">Verdi</SelectItem>
                  <SelectItem value="rent">Leie</SelectItem>
                  <SelectItem value="yield">Yield</SelectItem>
                  <SelectItem value="appreciation">Verdistigning</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground ml-auto">{properties.length} eiendommer</span>
            </div>

            {/* Property value history chart */}
            {propertyValueHistory.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Verdiutvikling per eiendom
                  </CardTitle>
                  <CardDescription className="text-xs">Basert på registrerte verdivurderinger</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                      <XAxis
                        dataKey="date"
                        fontSize={11}
                        tickLine={false}
                        allowDuplicatedCategory={false}
                        type="category"
                      />
                      <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} tickLine={false} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                      {propertyValueHistory.map((prop, i) => (
                        <Line
                          key={prop.address}
                          data={prop.data}
                          name={prop.address}
                          dataKey="value"
                          type="monotone"
                          stroke={CHART_COLORS[i % CHART_COLORS.length]}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Property financials comparison table */}
            {propertyFinancials.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    Finansiell oversikt per eiendom
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Eiendom</TableHead>
                          <TableHead className="text-right">Verdi</TableHead>
                          <TableHead className="text-right">Lån</TableHead>
                          <TableHead className="text-right">EK</TableHead>
                          <TableHead className="text-right">LTV</TableHead>
                          <TableHead className="text-right">Leie/mnd</TableHead>
                          <TableHead className="text-right">Lånekost/mnd</TableHead>
                          <TableHead className="text-right">Netto/mnd</TableHead>
                          <TableHead className="text-right">Yield</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {propertyFinancials.map((pf) => (
                          <TableRow key={pf.id}>
                            <TableCell className="font-medium text-sm">
                              <div>{pf.address.length > 25 ? pf.address.substring(0, 25) + '…' : pf.address}</div>
                              {pf.city && <div className="text-xs text-muted-foreground">{pf.city}</div>}
                            </TableCell>
                            <TableCell className="text-right text-sm">{formatCurrency(pf.currentValue, true)}</TableCell>
                            <TableCell className="text-right text-sm">{pf.loanAmount > 0 ? formatCurrency(pf.loanAmount, true) : '-'}</TableCell>
                            <TableCell className="text-right text-sm">{formatCurrency(pf.equity, true)}</TableCell>
                            <TableCell className="text-right text-sm">
                              <Badge variant={pf.ltv > 80 ? 'destructive' : pf.ltv > 60 ? 'secondary' : 'default'} className="text-xs">
                                {pf.ltv > 0 ? `${pf.ltv.toFixed(0)}%` : '-'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-sm">{pf.monthlyRent > 0 ? formatCurrency(pf.monthlyRent) : '-'}</TableCell>
                            <TableCell className="text-right text-sm">{pf.monthlyPayment > 0 ? formatCurrency(pf.monthlyPayment) : '-'}</TableCell>
                            <TableCell className={`text-right text-sm font-medium ${pf.netMonthly >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {pf.monthlyRent > 0 ? formatCurrency(pf.netMonthly) : '-'}
                            </TableCell>
                            <TableCell className="text-right text-sm">{pf.grossYield > 0 ? `${pf.grossYield.toFixed(1)}%` : '-'}</TableCell>
                          </TableRow>
                        ))}
                        {/* Totals row */}
                        <TableRow className="font-bold border-t-2">
                          <TableCell>Totalt</TableCell>
                          <TableCell className="text-right">{formatCurrency(summary.totalPortfolioValue, true)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(summary.totalLoanBalance, true)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(summary.totalEquity, true)}</TableCell>
                          <TableCell className="text-right">{summary.ltv > 0 ? `${summary.ltv.toFixed(0)}%` : '-'}</TableCell>
                          <TableCell className="text-right">{formatCurrency(summary.totalMonthlyRent)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(summary.monthlyLoanCost)}</TableCell>
                          <TableCell className={`text-right ${summary.netMonthlyCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(summary.netMonthlyCashflow)}
                          </TableCell>
                          <TableCell className="text-right">{summary.grossYield > 0 ? `${summary.grossYield.toFixed(1)}%` : '-'}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Property cards */}
            <div className="grid gap-4 md:grid-cols-2">
              {sortedProperties.map(property => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  leases={leases}
                  valuations={valuations}
                />
              ))}
            </div>

            {properties.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
                  <p className="text-muted-foreground">Ingen eiendommer registrert</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ════════════ CASHFLOW TAB ════════════ */}
          <TabsContent value="cashflow" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Per-property cashflow */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Inntekt vs Kostnad per eiendom</CardTitle>
                  <CardDescription className="text-xs">Månedlig leieinntekt vs lånekostnad</CardDescription>
                </CardHeader>
                <CardContent>
                  {cashflowComparison.length > 0 ? (
                    <ResponsiveContainer width="100%" height={Math.max(250, cashflowComparison.length * 50)}>
                      <BarChart data={cashflowComparison} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                        <XAxis type="number" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tickLine={false} />
                        <YAxis type="category" dataKey="name" fontSize={11} width={130} tickLine={false} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="income" name="Leieinntekt" fill="#16a34a" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="loanCost" name="Lånekostnad" fill="#dc2626" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                      Ingen utleieeiendommer med lån
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cashflow summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Cashflow-oversikt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Leieinntekt/mnd</span>
                      </div>
                      <span className="font-bold text-green-600">{formatCurrency(summary.totalMonthlyRent)}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <span className="text-sm">Lånekostnad/mnd</span>
                      </div>
                      <span className="font-bold text-red-600">-{formatCurrency(summary.monthlyLoanCost)}</span>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm font-medium">Netto cashflow</span>
                      </div>
                      <span className={`font-bold text-lg ${summary.netMonthlyCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(summary.netMonthlyCashflow)}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-[11px] text-muted-foreground">Brutto yield</p>
                      <p className="font-semibold text-lg">{summary.grossYield.toFixed(1)}%</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-[11px] text-muted-foreground">Netto yield</p>
                      <p className={`font-semibold text-lg ${summary.netYield >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {summary.netYield.toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-[11px] text-muted-foreground">Årlig netto</p>
                      <p className={`font-semibold ${summary.netMonthlyCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(summary.netMonthlyCashflow * 12, true)}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-[11px] text-muted-foreground">Belåningsgrad</p>
                      <p className="font-semibold">
                        {summary.ltv.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Active Leases */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Aktive leieavtaler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Eiendom</TableHead>
                        <TableHead className="text-right">Leie/mnd</TableHead>
                        <TableHead>Depositum</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>Slutt</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leases.slice(0, 20).map((lease) => {
                        const property = properties.find(p => p.id === lease.property_id);
                        return (
                          <TableRow key={lease.id}>
                            <TableCell className="font-medium text-sm">
                              {property?.address || lease.property_id.substring(0, 8) + '…'}
                            </TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(lease.monthly_rent)}</TableCell>
                            <TableCell className="text-sm">
                              {lease.deposit_amount ? formatCurrency(lease.deposit_amount) : '-'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {new Date(lease.start_date).toLocaleDateString('no-NO')}
                            </TableCell>
                            <TableCell className="text-sm">
                              {lease.end_date ? new Date(lease.end_date).toLocaleDateString('no-NO') : 'Løpende'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={lease.status === 'active' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {lease.status === 'active' ? 'Aktiv' : lease.status || 'Ukjent'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {leases.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Ingen leieavtaler registrert</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════════════ PROFIT & LOSS TAB ════════════ */}
          <TabsContent value="pnl" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* P&L Statement */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Resultatregnskap
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {profitLossData.monthCount} {profitLossData.monthCount === 1 ? 'måned' : 'måneder'} · {dateRange === '1m' ? 'Siste måned' : dateRange === '3m' ? 'Siste kvartal' : dateRange === '6m' ? 'Siste halvår' : dateRange === '1y' ? 'Siste 12 måneder' : 'Alle perioder'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {/* Income section */}
                    <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-3">Inntekter</h4>
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-sm">Leieinntekter ({profitLossData.monthCount} mnd)</span>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">{formatCurrency(profitLossData.totalIncome)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm font-semibold">Sum inntekter</span>
                        <span className="text-sm font-bold text-green-700 dark:text-green-400">{formatCurrency(profitLossData.totalIncome)}</span>
                      </div>
                    </div>

                    {/* Expenses section */}
                    <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-3">Kostnader</h4>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center py-1">
                          <span className="text-sm">Rentekostnader</span>
                          <span className="text-sm font-medium text-red-600">-{formatCurrency(profitLossData.totalInterest)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-sm">Avdrag på lån</span>
                          <span className="text-sm font-medium text-red-600">-{formatCurrency(profitLossData.totalPrincipal)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-sm">Andre utgifter</span>
                          <span className="text-sm font-medium text-red-600">-{formatCurrency(profitLossData.otherExpenses)}</span>
                        </div>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm font-semibold">Sum kostnader</span>
                        <span className="text-sm font-bold text-red-700 dark:text-red-400">-{formatCurrency(profitLossData.totalExpenses)}</span>
                      </div>
                    </div>

                    {/* Net result */}
                    <div className={`rounded-lg p-4 ${profitLossData.netProfit >= 0 ? 'bg-blue-50 dark:bg-blue-950/20' : 'bg-amber-50 dark:bg-amber-950/20'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-base font-bold">Netto resultat</span>
                        <span className={`text-xl font-bold ${profitLossData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(profitLossData.netProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-muted-foreground">Resultatmargin</span>
                        <span className={`text-sm font-medium ${profitLossData.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {profitLossData.profitMargin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* P&L Quick Stats */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Nøkkeltall</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-[11px] text-muted-foreground">Gjsn. mnd. inntekt</p>
                    <p className="font-semibold text-lg text-green-600">{formatCurrency(summary.totalMonthlyRent)}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-[11px] text-muted-foreground">Gjsn. mnd. kostnad</p>
                    <p className="font-semibold text-lg text-red-600">
                      {formatCurrency(summary.monthlyLoanCost + (profitLossData.monthCount > 0 ? profitLossData.otherExpenses / profitLossData.monthCount : 0))}
                    </p>
                  </div>
                  <Separator />
                  <MiniStat label="Inntekt per eiendom" value={summary.rentalProperties > 0 ? formatCurrency(summary.totalMonthlyRent / summary.rentalProperties) : '-'} icon={Home} />
                  <MiniStat label="Kostnad per eiendom" value={summary.totalProperties > 0 ? formatCurrency(summary.monthlyLoanCost / summary.totalProperties) : '-'} icon={Building2} />
                  <MiniStat label="Verdistigning" value={formatCurrency(summary.totalAppreciation, true)} icon={TrendingUp} />
                  <MiniStat label="Urealisert gevinst" value={formatPercent(summary.appreciationPercent)} icon={Target} />
                </CardContent>
              </Card>
            </div>

            {/* Monthly P&L trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-500" />
                  Resultattrend
                </CardTitle>
                <CardDescription className="text-xs">Månedlig netto resultat over tid</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={incomeVsExpenses}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                    <XAxis dataKey="month" fontSize={11} tickLine={false} />
                    <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tickLine={false} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" dataKey="income" name="Inntekt" fill="#16a34a" fillOpacity={0.1} stroke="#16a34a" strokeWidth={1.5} />
                    <Area type="monotone" dataKey="expenses" name="Utgifter" fill="#dc2626" fillOpacity={0.1} stroke="#dc2626" strokeWidth={1.5} />
                    <Line type="monotone" dataKey="net" name="Netto" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
                    <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════════════ PORTFOLIO HEALTH TAB ════════════ */}
          <TabsContent value="health" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Risk indicators */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-amber-500" />
                    Risikoindikatorer
                  </CardTitle>
                  <CardDescription className="text-xs">Nøkkeltall for porteføljehelse</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <HealthIndicator label="Belåningsgrad (LTV)" value={summary.ltv} max={100} good="low" />
                  <HealthIndicator label="Gjeldsbetjeningsgrad" value={summary.debtServiceRatio} max={150} good="low" />
                  <HealthIndicator label="Brutto yield" value={summary.grossYield} max={10} good="high" />
                  <HealthIndicator label="Netto yield" value={Math.max(summary.netYield, 0)} max={8} good="high" />
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      {summary.ltv < 70 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : summary.ltv < 85 ? (
                        <Clock className="h-4 w-4 text-amber-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span>
                        {summary.ltv < 70 ? 'Sunn belåningsgrad' : summary.ltv < 85 ? 'Moderat belåning' : 'Høy belåning — vurder nedbetaling'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {summary.netMonthlyCashflow >= 0 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span>
                        {summary.netMonthlyCashflow >= 0 ? 'Positiv cashflow' : 'Negativ cashflow — leieinntekter dekker ikke lånekostnader'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {summary.grossYield >= 4 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : summary.grossYield >= 2.5 ? (
                        <Clock className="h-4 w-4 text-amber-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span>
                        {summary.grossYield >= 4 ? 'God bruttoavkastning' : summary.grossYield >= 2.5 ? 'Moderat avkastning' : 'Lav avkastning'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Interest rate sensitivity */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Rentesensitivitet
                  </CardTitle>
                  <CardDescription className="text-xs">Effekt av renteendringer på cashflow</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const scenarios = [-2, -1, -0.5, 0, 0.5, 1, 2, 3].map(delta => {
                      const newMonthlyCost = properties.reduce((sum, p) => {
                        const rate = Math.max((p.interest_rate || 0) + delta, 0);
                        return sum + calculateMonthlyPayment(p.loan_amount || 0, rate, p.loan_duration_years || 0);
                      }, 0);
                      return {
                        scenario: `${delta >= 0 ? '+' : ''}${delta}%`,
                        monthlyCost: Math.round(newMonthlyCost),
                        netCashflow: Math.round(summary.totalMonthlyRent - newMonthlyCost),
                        isCurrent: delta === 0,
                      };
                    });

                    return (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={scenarios}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                          <XAxis dataKey="scenario" fontSize={11} tickLine={false} />
                          <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tickLine={false} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
                          <Bar dataKey="netCashflow" name="Netto cashflow">
                            {scenarios.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.isCurrent ? '#2563eb' : entry.netCashflow >= 0 ? '#16a34a' : '#dc2626'}
                                opacity={entry.isCurrent ? 1 : 0.7}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

            {/* Summary table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Nøkkeltall-sammendrag</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <MiniStat label="Porteføljeverdi" value={formatCurrency(summary.totalPortfolioValue, true)} icon={Building2} />
                  <MiniStat label="Kjøpspris totalt" value={formatCurrency(summary.totalPurchaseValue, true)} icon={Home} />
                  <MiniStat label="Verdistigning" value={`${formatCurrency(summary.totalAppreciation, true)} (${formatPercent(summary.appreciationPercent)})`} icon={TrendingUp} />
                  <MiniStat label="Egenkapital" value={formatCurrency(summary.totalEquity, true)} icon={Wallet} />
                  <MiniStat label="Total gjeld" value={formatCurrency(summary.totalLoanBalance, true)} icon={CreditCard} />
                  <MiniStat label="LTV" value={`${summary.ltv.toFixed(1)}%`} icon={Target} />
                  <MiniStat label="Mnd. inntekt" value={formatCurrency(summary.totalMonthlyRent)} icon={TrendingUp} />
                  <MiniStat label="Mnd. lånekostnad" value={formatCurrency(summary.monthlyLoanCost)} icon={TrendingDown} />
                  <MiniStat label="Netto cashflow/mnd" value={formatCurrency(summary.netMonthlyCashflow)} icon={DollarSign} />
                  <MiniStat label="Årlig netto" value={formatCurrency(summary.netMonthlyCashflow * 12, true)} icon={Calendar} />
                  <MiniStat label="Brutto yield" value={`${summary.grossYield.toFixed(1)}%`} icon={Percent} />
                  <MiniStat label="Netto yield" value={`${summary.netYield.toFixed(1)}%`} icon={Percent} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminFinanceDashboard;
