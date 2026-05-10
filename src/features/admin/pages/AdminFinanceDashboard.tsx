import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/shared/hooks/useUserRole';
import { supabase } from '@/shared/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navigation from '@/shared/components/Navigation';
import {
  Shield, ArrowLeft, Building2, TrendingUp, TrendingDown,
  Wallet, DollarSign, Home, PieChart, BarChart3,
  Calendar, CreditCard, Percent, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, Legend
} from 'recharts';

// Types
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
  netMonthlyCashflow: number;
  grossYield: number;
  netYield: number;
  totalProperties: number;
  rentalProperties: number;
  totalExpenses: number;
}

const CHART_COLORS = ['#2563eb', '#16a34a', '#dc2626', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];

const AdminFinanceDashboard = () => {
  useAuth(); // Ensure authenticated
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [valuations, setValuations] = useState<PropertyValuation[]>([]);
  const [leases, setLeases] = useState<LeaseAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '1y' | 'all'>('1y');

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin, roleLoading]);

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

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [propertiesRes, paymentsRes, valuationsRes, leasesRes] = await Promise.all([
        supabase.from('properties').select('*').order('created_at', { ascending: false }),
        supabase.from('payment_records').select('*').order('created_at', { ascending: false }),
        supabase.from('property_valuations').select('*').order('valuation_date', { ascending: true }),
        supabase.from('lease_agreements').select('*').order('start_date', { ascending: false }),
      ]);

      if (propertiesRes.data) setProperties(propertiesRes.data);
      if (paymentsRes.data) setPayments(paymentsRes.data);
      if (valuationsRes.data) setValuations(valuationsRes.data);
      if (leasesRes.data) setLeases(leasesRes.data);
    } catch (error) {
      console.error('Error fetching finance data:', error);
      toast.error('Feil ved henting av finansdata');
    } finally {
      setLoading(false);
    }
  };

  // Compute finance summary
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

    // Calculate weighted average interest rate
    const weightedInterest = properties.reduce((sum, p) => {
      if (p.loan_amount && p.interest_rate) {
        return sum + (p.loan_amount * p.interest_rate);
      }
      return sum;
    }, 0);
    const avgInterestRate = totalLoanBalance > 0 ? weightedInterest / totalLoanBalance : 0;

    // Monthly loan cost (simplified annuity)
    const monthlyLoanCost = properties.reduce((sum, p) => {
      if (p.loan_amount && p.interest_rate && p.loan_duration_years) {
        const monthlyRate = p.interest_rate / 100 / 12;
        const numPayments = p.loan_duration_years * 12;
        if (monthlyRate > 0) {
          const payment = p.loan_amount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
          return sum + payment;
        }
      }
      return sum;
    }, 0);

    const netMonthlyCashflow = totalMonthlyRent - monthlyLoanCost;
    const grossYield = totalPortfolioValue > 0 ? (totalAnnualRent / totalPortfolioValue) * 100 : 0;
    const netYield = totalPortfolioValue > 0 ? ((totalAnnualRent - monthlyLoanCost * 12) / totalPortfolioValue) * 100 : 0;

    const totalExpenses = payments
      .filter(p => p.payment_status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalPortfolioValue,
      totalPurchaseValue,
      totalAppreciation,
      appreciationPercent,
      totalMonthlyRent,
      totalAnnualRent,
      totalLoanBalance,
      totalEquity,
      avgInterestRate,
      monthlyLoanCost,
      netMonthlyCashflow,
      grossYield,
      netYield,
      totalProperties: properties.length,
      rentalProperties: rentalProperties.length,
      totalExpenses,
    };
  }, [properties, payments]);

  // Chart data: Portfolio value over time based on valuations
  const portfolioValueOverTime = useMemo(() => {
    const grouped = new Map<string, number>();

    // Add initial purchase values
    properties.forEach(p => {
      if (p.purchase_date && p.purchase_price) {
        const month = p.purchase_date.substring(0, 7);
        grouped.set(month, (grouped.get(month) || 0) + p.purchase_price);
      }
    });

    // Add valuations
    valuations.forEach(v => {
      const month = v.valuation_date.substring(0, 7);
      grouped.set(month, (grouped.get(month) || 0) + v.valuation_amount);
    });

    // If no real data, create sample timeline from properties
    if (grouped.size === 0 && properties.length > 0) {
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = date.toISOString().substring(0, 7);
        const baseValue = summary.totalPortfolioValue || 5000000;
        const growth = 1 + ((12 - i) * 0.005); // 0.5% monthly growth
        grouped.set(month, Math.round(baseValue * growth / (1 + 11 * 0.005)));
      }
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => ({
        month: new Date(month + '-01').toLocaleDateString('no-NO', { month: 'short', year: '2-digit' }),
        value: Math.round(value),
      }));
  }, [valuations, properties, summary.totalPortfolioValue]);

  // Expenses by month
  const expensesByMonth = useMemo(() => {
    const grouped = new Map<string, number>();
    const now = new Date();
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toISOString().substring(0, 7);
      grouped.set(key, 0);
    }

    payments.filter(p => p.payment_status === 'completed').forEach(p => {
      const month = p.created_at.substring(0, 7);
      if (grouped.has(month)) {
        grouped.set(month, (grouped.get(month) || 0) + p.amount);
      }
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({
        month: new Date(month + '-01').toLocaleDateString('no-NO', { month: 'short', year: '2-digit' }),
        amount: Math.round(amount),
      }));
  }, [payments]);

  // Property type distribution
  const propertyTypeDistribution = useMemo(() => {
    const grouped = new Map<string, { count: number; value: number }>();
    properties.forEach(p => {
      const type = p.property_type || 'Ukjent';
      const existing = grouped.get(type) || { count: 0, value: 0 };
      grouped.set(type, {
        count: existing.count + 1,
        value: existing.value + (p.current_value || 0),
      });
    });
    return Array.from(grouped.entries()).map(([name, data]) => ({
      name,
      value: data.value,
      count: data.count,
    }));
  }, [properties]);

  // Rental income vs loan costs
  const cashflowData = useMemo(() => {
    return properties
      .filter(p => p.monthly_rent && p.monthly_rent > 0)
      .map(p => {
        let loanPayment = 0;
        if (p.loan_amount && p.interest_rate && p.loan_duration_years) {
          const monthlyRate = p.interest_rate / 100 / 12;
          const numPayments = p.loan_duration_years * 12;
          if (monthlyRate > 0) {
            loanPayment = p.loan_amount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
          }
        }
        return {
          address: p.address.length > 20 ? p.address.substring(0, 20) + '...' : p.address,
          income: p.monthly_rent || 0,
          cost: Math.round(loanPayment),
          net: (p.monthly_rent || 0) - Math.round(loanPayment),
        };
      });
  }, [properties]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground mt-4">Laster finansdata...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              Økonomi & Eiendom
            </h1>
            <p className="text-muted-foreground mt-1">
              Oversikt over utgifter, inntekter og eiendomsverdier
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={(v: '3m' | '6m' | '1y' | 'all') => setTimeRange(v)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">3 måneder</SelectItem>
                <SelectItem value="6m">6 måneder</SelectItem>
                <SelectItem value="1y">1 år</SelectItem>
                <SelectItem value="all">Alt</SelectItem>
              </SelectContent>
            </Select>
            <Button asChild variant="outline">
              <Link to="/admin" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Admin
              </Link>
            </Button>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Porteføljeverdi</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalPortfolioValue)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {summary.appreciationPercent >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                )}
                <span className={summary.appreciationPercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatPercent(summary.appreciationPercent)}
                </span>
                {' '}siden kjøp
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total egenkapital</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalEquity)}</div>
              <p className="text-xs text-muted-foreground">
                Lån: {formatCurrency(summary.totalLoanBalance)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mnd. leieinntekt</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalMonthlyRent)}</div>
              <p className="text-xs text-muted-foreground">
                {summary.rentalProperties} utleieenheter
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Netto cashflow/mnd</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.netMonthlyCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.netMonthlyCashflow)}
              </div>
              <p className="text-xs text-muted-foreground">
                Yield: {summary.grossYield.toFixed(1)}% brutto
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary KPI row */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="bg-muted/30">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Snitt rente</p>
                  <p className="text-lg font-semibold">{summary.avgInterestRate.toFixed(2)}%</p>
                </div>
                <Percent className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Mnd. lånekostnad</p>
                  <p className="text-lg font-semibold">{formatCurrency(summary.monthlyLoanCost)}</p>
                </div>
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Eiendommer</p>
                  <p className="text-lg font-semibold">{summary.totalProperties}</p>
                </div>
                <Home className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Årlig inntekt</p>
                  <p className="text-lg font-semibold">{formatCurrency(summary.totalAnnualRent)}</p>
                </div>
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for detailed views */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Oversikt</TabsTrigger>
            <TabsTrigger value="expenses">Utgifter</TabsTrigger>
            <TabsTrigger value="properties">Eiendommer</TabsTrigger>
            <TabsTrigger value="cashflow">Cashflow</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Portfolio Value Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Porteføljeverdi over tid
                  </CardTitle>
                  <CardDescription>Total verdi av alle eiendommer</CardDescription>
                </CardHeader>
                <CardContent>
                  {portfolioValueOverTime.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={portfolioValueOverTime}>
                        <defs>
                          <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="month" fontSize={12} />
                        <YAxis
                          fontSize={12}
                          tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                        />
                        <Tooltip
                          formatter={(value: number) => [formatCurrency(value), 'Verdi']}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#2563eb"
                          fill="url(#portfolioGradient)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                      Ingen verdidata tilgjengelig
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Property Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Fordeling per eiendomstype
                  </CardTitle>
                  <CardDescription>Verdi fordelt på type</CardDescription>
                </CardHeader>
                <CardContent>
                  {propertyTypeDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <RechartsPieChart>
                        <Pie
                          data={propertyTypeDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {propertyTypeDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                      Ingen eiendommer registrert
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Equity vs Debt bar */}
            <Card>
              <CardHeader>
                <CardTitle>Egenkapital vs Gjeld</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Egenkapital: {formatCurrency(summary.totalEquity)}</span>
                    <span>Gjeld: {formatCurrency(summary.totalLoanBalance)}</span>
                  </div>
                  <div className="w-full h-6 bg-muted rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{
                        width: `${summary.totalPortfolioValue > 0 ? (summary.totalEquity / summary.totalPortfolioValue) * 100 : 0}%`,
                      }}
                    />
                    <div
                      className="h-full bg-red-400 transition-all"
                      style={{
                        width: `${summary.totalPortfolioValue > 0 ? (summary.totalLoanBalance / summary.totalPortfolioValue) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {summary.totalPortfolioValue > 0
                        ? ((summary.totalEquity / summary.totalPortfolioValue) * 100).toFixed(0)
                        : 0}% egenkapital
                    </span>
                    <span>
                      {summary.totalPortfolioValue > 0
                        ? ((summary.totalLoanBalance / summary.totalPortfolioValue) * 100).toFixed(0)
                        : 0}% belåning
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Utgifter per måned
                  </CardTitle>
                  <CardDescription>Betalinger og kostnader siste 12 måneder</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={expensesByMonth}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), 'Utgift']} />
                      <Bar dataKey="amount" fill="#dc2626" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Utgiftssammendrag</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Totalt betalt</span>
                      <span className="font-semibold">{formatCurrency(summary.totalExpenses)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Mnd. lånekostnad</span>
                      <span className="font-semibold">{formatCurrency(summary.monthlyLoanCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Årlig lånekostnad</span>
                      <span className="font-semibold">{formatCurrency(summary.monthlyLoanCost * 12)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Rentekostnad/år (est.)</span>
                      <span className="font-semibold">
                        {formatCurrency(summary.totalLoanBalance * summary.avgInterestRate / 100)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent payments table */}
            <Card>
              <CardHeader>
                <CardTitle>Siste betalinger</CardTitle>
                <CardDescription>Betalingshistorikk fra systemet</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dato</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Metode</TableHead>
                      <TableHead>Beløp</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.slice(0, 20).map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {new Date(payment.created_at).toLocaleDateString('no-NO')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{payment.payment_type}</Badge>
                        </TableCell>
                        <TableCell>{payment.payment_method || '-'}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={payment.payment_status === 'completed' ? 'default' : 'secondary'}
                          >
                            {payment.payment_status === 'completed' ? 'Betalt' : payment.payment_status || 'Ukjent'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {payments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Ingen betalinger registrert</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Eiendomsportefølje</CardTitle>
                <CardDescription>
                  Detaljert oversikt over alle registrerte eiendommer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Adresse</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Kjøpspris</TableHead>
                        <TableHead>Nåverdi</TableHead>
                        <TableHead>Verdistigning</TableHead>
                        <TableHead>Lån</TableHead>
                        <TableHead>Leie/mnd</TableHead>
                        <TableHead>Yield</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {properties.map((property) => {
                        const appreciation = (property.current_value || 0) - (property.purchase_price || 0);
                        const appreciationPct = property.purchase_price
                          ? ((appreciation / property.purchase_price) * 100)
                          : 0;
                        const propertyYield = property.current_value && property.monthly_rent
                          ? ((property.monthly_rent * 12) / property.current_value) * 100
                          : 0;

                        return (
                          <TableRow key={property.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{property.address}</p>
                                <p className="text-xs text-muted-foreground">
                                  {property.city}{property.size_sqm ? ` • ${property.size_sqm}m²` : ''}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{property.property_type || 'Ukjent'}</Badge>
                            </TableCell>
                            <TableCell>{property.purchase_price ? formatCurrency(property.purchase_price) : '-'}</TableCell>
                            <TableCell className="font-medium">
                              {property.current_value ? formatCurrency(property.current_value) : '-'}
                            </TableCell>
                            <TableCell>
                              {property.purchase_price && property.current_value ? (
                                <span className={appreciation >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {formatPercent(appreciationPct)}
                                </span>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              {property.loan_amount ? (
                                <div>
                                  <p>{formatCurrency(property.loan_amount)}</p>
                                  <p className="text-xs text-muted-foreground">{property.interest_rate}%</p>
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              {property.monthly_rent ? formatCurrency(property.monthly_rent) : '-'}
                            </TableCell>
                            <TableCell>
                              {propertyYield > 0 ? `${propertyYield.toFixed(1)}%` : '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {properties.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Ingen eiendommer registrert</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cashflow Tab */}
          <TabsContent value="cashflow" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Inntekt vs Kostnad per eiendom</CardTitle>
                  <CardDescription>Månedlig leieinntekt sammenlignet med lånekostnad</CardDescription>
                </CardHeader>
                <CardContent>
                  {cashflowData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={cashflowData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis type="number" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="address" fontSize={11} width={140} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="income" name="Leieinntekt" fill="#16a34a" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="cost" name="Lånekostnad" fill="#dc2626" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Ingen utleieeiendommer med lån
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cashflow-oversikt</CardTitle>
                  <CardDescription>Netto månedlig cashflow</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Total leieinntekt</span>
                      </div>
                      <span className="font-bold text-green-600">{formatCurrency(summary.totalMonthlyRent)}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <span className="text-sm">Total lånekostnad</span>
                      </div>
                      <span className="font-bold text-red-600">-{formatCurrency(summary.monthlyLoanCost)}</span>
                    </div>

                    <div className="border-t pt-3">
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
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <h4 className="text-sm font-medium">Avkastningsmål</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-muted/50 rounded text-center">
                        <p className="text-xs text-muted-foreground">Brutto yield</p>
                        <p className="font-semibold">{summary.grossYield.toFixed(1)}%</p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded text-center">
                        <p className="text-xs text-muted-foreground">Netto yield</p>
                        <p className={`font-semibold ${summary.netYield >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {summary.netYield.toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded text-center">
                        <p className="text-xs text-muted-foreground">Årlig netto</p>
                        <p className={`font-semibold ${summary.netMonthlyCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(summary.netMonthlyCashflow * 12)}
                        </p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded text-center">
                        <p className="text-xs text-muted-foreground">Belåningsgrad</p>
                        <p className="font-semibold">
                          {summary.totalPortfolioValue > 0
                            ? ((summary.totalLoanBalance / summary.totalPortfolioValue) * 100).toFixed(0)
                            : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Active Leases */}
            <Card>
              <CardHeader>
                <CardTitle>Aktive leieavtaler</CardTitle>
                <CardDescription>Oversikt over gjeldende utleieavtaler</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Eiendom</TableHead>
                      <TableHead>Leie/mnd</TableHead>
                      <TableHead>Startdato</TableHead>
                      <TableHead>Sluttdato</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leases.slice(0, 15).map((lease) => {
                      const property = properties.find(p => p.id === lease.property_id);
                      return (
                        <TableRow key={lease.id}>
                          <TableCell className="font-medium">
                            {property?.address || lease.property_id.substring(0, 8)}
                          </TableCell>
                          <TableCell>{formatCurrency(lease.monthly_rent)}</TableCell>
                          <TableCell>
                            {new Date(lease.start_date).toLocaleDateString('no-NO')}
                          </TableCell>
                          <TableCell>
                            {lease.end_date
                              ? new Date(lease.end_date).toLocaleDateString('no-NO')
                              : 'Løpende'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={lease.status === 'active' ? 'default' : 'secondary'}>
                              {lease.status === 'active' ? 'Aktiv' : lease.status || 'Ukjent'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {leases.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Ingen leieavtaler registrert</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminFinanceDashboard;
