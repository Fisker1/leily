import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/shared/hooks/useUserRole';
import { supabase } from '@/shared/integrations/supabase/client';
import { localData } from '@/shared/integrations/local/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/shared/components/Navigation';
import {
  FileText, Users, Calendar, DollarSign, Shield, ArrowLeft,
  Building2, TrendingUp, TrendingDown, Wallet, PieChart,
  ArrowUpRight, ArrowDownRight, Activity,
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LegalDocumentsManager } from '@/features/admin/components/LegalDocumentsManager';
import {
  BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, Legend,
} from 'recharts';

const CHART_COLORS = ['#2563eb', '#16a34a', '#dc2626', '#f59e0b', '#8b5cf6', '#06b6d4'];

interface Report {
  id: string;
  user_id: string;
  report_type: string;
  generated_at: string;
  file_name: string | null;
  file_size: number | null;
  property_data: any;
  calculations: any;
  payment_record_id: string | null;
  profiles?: {
    full_name: string | null;
    email: string;
  } | null;
  payment_records?: {
    amount: number;
    payment_status: string;
    payment_method: string | null;
  } | null;
}

interface AdminStats {
  totalReports: number;
  totalUsers: number;
  totalRevenue: number;
  reportsToday: number;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalReports: 0,
    totalUsers: 0,
    totalRevenue: 0,
    reportsToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [dataCopyLoading, setDataCopyLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    if (isAdmin) {
      fetchReports();
      fetchStats();
      fetchFinanceData();
    }
  }, [isAdmin, roleLoading]);

  const fetchFinanceData = async () => {
    try {
      const [propRes, expRes] = await Promise.all([
        localData.from('properties').select('*'),
        localData.from('payment_records').select('*'),
      ]);
      if (propRes.data) setProperties(propRes.data as any[]);
      if (expRes.data) setExpenses(expRes.data as any[]);
    } catch (e) {
      console.error('Error fetching finance data:', e);
    }
  };

  // ─── Computed portfolio summary ─────────────────────────────────────
  const portfolioSummary = useMemo(() => {
    const totalValue = properties.reduce((s: number, p: any) => s + (p.current_value || 0), 0);
    const totalPurchase = properties.reduce((s: number, p: any) => s + (p.purchase_price || 0), 0);
    const totalAppreciation = totalValue - totalPurchase;
    const appreciationPct = totalPurchase > 0 ? (totalAppreciation / totalPurchase) * 100 : 0;
    const totalLoan = properties.reduce((s: number, p: any) => s + (p.loan_amount || 0), 0);
    const totalEquity = totalValue - totalLoan;
    const totalMonthlyRent = properties.filter((p: any) => !p.primary_residence).reduce((s: number, p: any) => s + (p.monthly_rent || 0), 0);
    const ltv = totalValue > 0 ? (totalLoan / totalValue) * 100 : 0;

    // Expenses last 12 months
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);
    const recentExpenses = expenses.filter((e: any) => e.payment_status === 'completed' && new Date(e.created_at) >= oneYearAgo);
    const totalExpenses12m = recentExpenses.reduce((s: number, e: any) => s + e.amount, 0);
    const monthlyAvgExpense = totalExpenses12m / 12;

    // Expenses by category
    const byCategory: Record<string, number> = {};
    recentExpenses.forEach((e: any) => {
      byCategory[e.payment_type] = (byCategory[e.payment_type] || 0) + e.amount;
    });
    const expenseCategories = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Expenses by month (last 6 months)
    const expensesByMonth: Array<{ month: string; amount: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().substring(0, 7);
      const label = d.toLocaleDateString('no-NO', { month: 'short' });
      const monthExpenses = recentExpenses.filter((e: any) => e.created_at.substring(0, 7) === key);
      expensesByMonth.push({ month: label, amount: monthExpenses.reduce((s: number, e: any) => s + e.amount, 0) });
    }

    // Property value breakdown
    const propertyValues = properties.map((p: any) => ({
      name: p.address?.split(' ').slice(0, 2).join(' ') || 'Ukjent',
      value: p.current_value || 0,
    }));

    return {
      totalValue, totalPurchase, totalAppreciation, appreciationPct,
      totalLoan, totalEquity, totalMonthlyRent, ltv,
      totalExpenses12m, monthlyAvgExpense,
      expenseCategories, expensesByMonth, propertyValues,
      propertyCount: properties.length,
      rentalCount: properties.filter((p: any) => !p.primary_residence && (p.monthly_rent || 0) > 0).length,
    };
  }, [properties, expenses]);

  // Redirect non-admins - security boundary
  if (!roleLoading && !isAdmin) {
    toast.error('Kun administratorer har tilgang til denne siden');
    return <Navigate to="/dashboard" replace />;
  }

  // Show loading state while checking authorization
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

  const fetchReports = async () => {
    try {
      // First get the reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(100);

      if (reportsError) {
        console.error('Error fetching reports:', reportsError);
        toast.error('Feil ved henting av rapporter');
        return;
      }

      if (!reportsData || reportsData.length === 0) {
        setReports([]);
        return;
      }

      // Get unique user IDs and payment record IDs
      const userIds = [...new Set(reportsData.map(r => r.user_id).filter(Boolean))];
      const paymentIds = [...new Set(reportsData.map(r => r.payment_record_id).filter(Boolean))];

      // Fetch user profiles
      const profilesPromise = userIds.length > 0 
        ? supabase.from('profiles').select('id, full_name, email').in('id', userIds)
        : Promise.resolve({ data: [], error: null });

      // Fetch payment records
      const paymentsPromise = paymentIds.length > 0
        ? supabase.from('payment_records').select('id, amount, payment_status, payment_method').in('id', paymentIds)
        : Promise.resolve({ data: [], error: null });

      const [{ data: profiles }, { data: payments }] = await Promise.all([profilesPromise, paymentsPromise]);

      // Create lookup maps
      const profileMap = new Map<string, { full_name: string | null; email: string }>();
      profiles?.forEach(p => profileMap.set(p.id, { full_name: p.full_name, email: p.email }));
      
      const paymentMap = new Map<string, { amount: number; payment_status: string; payment_method: string | null }>();
      payments?.forEach(p => paymentMap.set(p.id, { amount: p.amount, payment_status: p.payment_status, payment_method: p.payment_method }));

      // Combine the data
      const combinedReports: Report[] = reportsData.map(report => ({
        ...report,
        profiles: report.user_id ? profileMap.get(report.user_id) || null : null,
        payment_records: report.payment_record_id ? paymentMap.get(report.payment_record_id) || null : null
      }));

      setReports(combinedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Feil ved henting av rapporter');
    }
  };

  const fetchStats = async () => {
    try {
      // Get total reports count
      const { count: totalReports } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true });

      // Get total users count  
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total revenue from payment records
      const { data: payments } = await supabase
        .from('payment_records')
        .select('amount')
        .eq('payment_status', 'completed');

      const totalRevenue = payments?.reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0) || 0;

      // Get reports generated today
      const today = new Date().toISOString().split('T')[0];
      const { count: reportsToday } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .gte('generated_at', `${today}T00:00:00Z`)
        .lt('generated_at', `${today}T23:59:59Z`);

      setStats({
        totalReports: totalReports || 0,
        totalUsers: totalUsers || 0,
        totalRevenue,
        reportsToday: reportsToday || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('no-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Ukjent';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleCopyProductionData = async () => {
    setDataCopyLoading(true);
    try {
      toast.info('Starter kopiering av produksjonsdata...');
      
      const { data, error } = await supabase.functions.invoke('copy-production-data', {});
      
      if (error) {
        console.error('Error copying data:', error);
        toast.error('Feil ved kopiering av data: ' + error.message);
        return;
      }
      
      if (data?.success) {
        toast.success(`Data kopiert! ${data.totalRecords} poster i ${data.copiedTables.length} tabeller`);
        // Refresh stats after successful copy
        fetchStats();
        fetchReports();
      } else {
        toast.error('Kopiering feilet: ' + (data?.error || 'Ukjent feil'));
      }
    } catch (error) {
      console.error('Error copying data:', error);
      toast.error('Feil ved kopiering av data');
    } finally {
      setDataCopyLoading(false);
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p>Laster...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-destructive" />
                Ingen tilgang
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Du har ikke tilgang til admin-dashbordet.</p>
              <Button asChild className="w-full mt-4">
                <Link to="/dashboard">Tilbake til dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Oversikt over systemet, brukere og sikkerhet
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="default">
              <Link to="/admin/finance" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Økonomi & Eiendom
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/dashboard" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Tilbake
              </Link>
            </Button>
          </div>
        </div>

        {/* Tabbed Dashboard Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Oversikt</TabsTrigger>
            <TabsTrigger value="legal">Juridiske Dokumenter</TabsTrigger>
            <TabsTrigger value="security">Sikkerhet</TabsTrigger>
            <TabsTrigger value="staging">Staging</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totale rapporter</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReports}</div>
              <p className="text-xs text-muted-foreground">
                {stats.reportsToday} i dag
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registrerte brukere</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Totalt antall brukere
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total omsetning</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Fra PDF-eksporter
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rapporter i dag</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.reportsToday}</div>
              <p className="text-xs text-muted-foreground">
                Genererte i dag
              </p>
            </CardContent>
          </Card>
            </div>

            {/* ─── Real Estate & Expense Summary ──────────────────────── */}
            {properties.length > 0 && (
              <>
                {/* Portfolio KPI row */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Porteføljeverdi</CardTitle>
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(portfolioSummary.totalValue)}</div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        {portfolioSummary.totalAppreciation >= 0 ? (
                          <ArrowUpRight className="h-3 w-3 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 text-red-500" />
                        )}
                        <span className={portfolioSummary.totalAppreciation >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {portfolioSummary.appreciationPct >= 0 ? '+' : ''}{portfolioSummary.appreciationPct.toFixed(1)}%
                        </span>
                        <span>siden kjøp</span>
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Egenkapital</CardTitle>
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(portfolioSummary.totalEquity)}</div>
                      <p className="text-xs text-muted-foreground">
                        LTV: {portfolioSummary.ltv.toFixed(0)}%
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Leieinntekter/mnd</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(portfolioSummary.totalMonthlyRent)}</div>
                      <p className="text-xs text-muted-foreground">
                        {portfolioSummary.rentalCount} utleieenheter
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Utgifter (12 mnd)</CardTitle>
                      <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(portfolioSummary.totalExpenses12m)}</div>
                      <p className="text-xs text-muted-foreground">
                        Snitt {formatCurrency(portfolioSummary.monthlyAvgExpense)}/mnd
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts row */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Property Value Breakdown */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-500" />
                        Eiendomsverdi fordeling
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <RechartsPieChart>
                          <Pie
                            data={portfolioSummary.propertyValues}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            labelLine={false}
                          >
                            {portfolioSummary.propertyValues.map((_: any, i: number) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [formatCurrency(value), 'Verdi']} />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Expense trend (last 6 months) */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-amber-500" />
                        Utgifter siste 6 måneder
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={portfolioSummary.expensesByMonth}>
                          <XAxis dataKey="month" fontSize={12} tickLine={false} />
                          <YAxis hide />
                          <Tooltip formatter={(value: number) => [formatCurrency(value), 'Utgifter']} />
                          <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Expense categories + LTV Progress */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <PieChart className="h-4 w-4 text-purple-500" />
                        Utgifter etter kategori (12 mnd)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {portfolioSummary.expenseCategories.slice(0, 6).map((cat: any, i: number) => (
                          <div key={cat.name} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{cat.name}</span>
                              <span className="font-medium">{formatCurrency(cat.value)}</span>
                            </div>
                            <Progress
                              value={(cat.value / (portfolioSummary.expenseCategories[0]?.value || 1)) * 100}
                              className="h-2"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="h-4 w-4 text-green-500" />
                        Portefølje helseoversikt
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Belåningsgrad (LTV)</span>
                            <span className="font-medium">{portfolioSummary.ltv.toFixed(1)}%</span>
                          </div>
                          <Progress value={portfolioSummary.ltv} className="h-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="p-3 bg-muted/40 rounded-lg">
                            <p className="text-muted-foreground">Eiendommer</p>
                            <p className="text-lg font-semibold">{portfolioSummary.propertyCount}</p>
                          </div>
                          <div className="p-3 bg-muted/40 rounded-lg">
                            <p className="text-muted-foreground">Utleie</p>
                            <p className="text-lg font-semibold">{portfolioSummary.rentalCount}</p>
                          </div>
                          <div className="p-3 bg-muted/40 rounded-lg">
                            <p className="text-muted-foreground">Total lån</p>
                            <p className="text-lg font-semibold">{formatCurrency(portfolioSummary.totalLoan)}</p>
                          </div>
                          <div className="p-3 bg-muted/40 rounded-lg">
                            <p className="text-muted-foreground">Verdistigning</p>
                            <p className={`text-lg font-semibold ${portfolioSummary.totalAppreciation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(portfolioSummary.totalAppreciation)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-center">
                  <Button asChild variant="outline" size="lg">
                    <Link to="/admin/finance" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Se fullstendig finansoversikt
                    </Link>
                  </Button>
                </div>
              </>
            )}

            {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>Genererte rapporter</CardTitle>
            <CardDescription>
              Oversikt over alle PDF-rapporter som er generert av brukere
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bruker</TableHead>
                  <TableHead>Rapport type</TableHead>
                  <TableHead>Eiendomsverdi</TableHead>
                  <TableHead>Generert</TableHead>
                  <TableHead>Filstørrelse</TableHead>
                  <TableHead>Betaling</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{report.profiles?.full_name || 'Ukjent bruker'}</p>
                        <p className="text-sm text-muted-foreground">{report.profiles?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{report.report_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {report.property_data?.propertyValue ? 
                        formatCurrency(report.property_data.propertyValue) : 
                        'Ikke oppgitt'
                      }
                    </TableCell>
                    <TableCell>{formatDate(report.generated_at)}</TableCell>
                    <TableCell>{formatFileSize(report.file_size || 0)}</TableCell>
                    <TableCell>
                      {report.payment_records ? (
                        <div>
                          <p className="font-medium">{formatCurrency(report.payment_records.amount)}</p>
                          <p className="text-sm text-muted-foreground">{report.payment_records.payment_method}</p>
                        </div>
                      ) : (
                        <Badge variant="outline">Gratis</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          report.payment_records?.payment_status === 'completed' ? 'default' : 
                          report.payment_records?.payment_status === 'pending' ? 'secondary' : 
                          'outline'
                        }
                      >
                        {report.payment_records?.payment_status === 'completed' ? 'Betalt' :
                         report.payment_records?.payment_status === 'pending' ? 'Venter' :
                         'Gratis'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {reports.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingen rapporter funnet</p>
              </div>
            )}
            </CardContent>
          </Card>
          </TabsContent>

          <TabsContent value="legal">
            <LegalDocumentsManager />
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Sikkerhet
                </CardTitle>
                <CardDescription>
                  Sikkerhetsfunksjoner er kun tilgjengelige i production miljø
                </CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>

          <TabsContent value="staging">
            <Card>
              <CardHeader>
                <CardTitle>Staging Database Management</CardTitle>
                <CardDescription>
                  Kopier produksjonsdata til staging for testing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Kopier produksjonsdata</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Denne funksjonen kopierer all data fra produksjonsdatabasen til staging-databasen.
                    Eksisterende data i staging vil bli overskrevet.
                  </p>
                  <Button 
                    onClick={handleCopyProductionData}
                    disabled={dataCopyLoading}
                    className="w-full"
                  >
                    {dataCopyLoading ? 'Kopierer data...' : 'Kopier produksjonsdata'}
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p><strong>Fra:</strong> Produksjon → Supabase (se Vercel env)</p>
                  <p><strong>Til:</strong> Staging → Supabase (se Vercel env)</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;