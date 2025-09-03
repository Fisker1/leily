import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';
import { FileText, Users, Download, Calendar, DollarSign, Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import SecurityDashboard from '@/components/security/SecurityDashboard';

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

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error('Kun administratorer har tilgang til denne siden');
      return;
    }

    if (isAdmin) {
      fetchReports();
      fetchStats();
    }
  }, [isAdmin, roleLoading]);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          ),
          payment_records:payment_record_id (
            amount,
            payment_status,
            payment_method
          )
        `)
        .order('generated_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching reports:', error);
        toast.error('Feil ved henting av rapporter');
        return;
      }

      // Type cast to fix TypeScript issues with complex Supabase joins
      setReports((data as any) || []);
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
          <Button asChild variant="outline">
            <Link to="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Tilbake
            </Link>
          </Button>
        </div>

        {/* Tabbed Dashboard Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Oversikt</TabsTrigger>
            <TabsTrigger value="security">Sikkerhet</TabsTrigger>
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

          <TabsContent value="security">
            <SecurityDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;