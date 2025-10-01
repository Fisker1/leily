import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { getTenantsWithMaskedData, logTenantDataAccess } from '@/lib/tenantSecurity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Home, Users, FileText, DollarSign, Calendar, ArrowRight, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import CreditsBar from '@/components/CreditsBar';

interface DashboardStats {
  totalProperties: number;
  totalTenants: number;
  totalActiveLeases: number;
  totalMonthlyIncome: number;
  upcomingExpirations: number;
}

const Dashboard = () => {
  const { profile, user } = useAuth();
  const { translations, language } = useLanguage();
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    totalTenants: 0,
    totalActiveLeases: 0,
    totalMonthlyIncome: 0,
    upcomingExpirations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch properties count
      const { count: propertiesCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });

      // Fetch tenants count using secure access
      const { data: tenantsData, error: tenantsError } = await getTenantsWithMaskedData(user.id);
      const tenantsCount = tenantsData?.length || 0;
      
      if (tenantsError) {
        console.error('Error fetching secure tenant data for dashboard:', tenantsError);
      }

      // Log secure tenant data access for dashboard
      if (tenantsCount > 0) {
        await logTenantDataAccess('dashboard_stats', 'dashboard', {
          action: 'count_tenants',
          tenant_count: tenantsCount,
          access_type: 'count_only'
        });
      }

      // Fetch active leases and calculate monthly income
      const { data: activeLeases, count: activeLeasesCount } = await supabase
        .from('lease_agreements')
        .select('monthly_rent, end_date', { count: 'exact' })
        .eq('status', 'active');

      const totalMonthlyIncome = activeLeases?.reduce((sum, lease) => 
        sum + (parseFloat(lease.monthly_rent?.toString() || '0')), 0) || 0;

      // Count leases expiring in the next 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { count: upcomingExpirations } = await supabase
        .from('lease_agreements')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .lt('end_date', thirtyDaysFromNow.toISOString().split('T')[0]);

      setStats({
        totalProperties: propertiesCount || 0,
        totalTenants: tenantsCount,
        totalActiveLeases: activeLeasesCount || 0,
        totalMonthlyIncome,
        upcomingExpirations: upcomingExpirations || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: translations.dashboard.addProperty,
      description: translations.dashboard.addPropertyDesc,
      icon: Plus,
      href: '/properties/new',
      color: 'primary',
    },
    {
      title: translations.dashboard.addTenant,
      description: translations.dashboard.addTenantDesc,
      icon: Users,
      href: '/tenants/new',
      color: 'secondary',
    },
    {
      title: translations.dashboard.createLease,
      description: translations.dashboard.createLeaseDesc,
      icon: FileText,
      href: '/utleie',
      color: 'accent',
    },
    {
      title: 'Kalkyle/Nytt kjøp',
      description: 'Analyser nye investeringsmuligheter',
      icon: Calculator,
      href: '/calculator',
      color: 'secondary',
    },
  ];

  const statCards = [
    {
      title: translations.dashboard.properties,
      value: stats.totalProperties.toString(),
      icon: Home,
      description: translations.dashboard.totalProperties,
    },
    {
      title: translations.dashboard.tenants,
      value: stats.totalTenants.toString(),
      icon: Users,
      description: translations.dashboard.totalTenants,
    },
    {
      title: translations.dashboard.activeLeases,
      value: stats.totalActiveLeases.toString(),
      icon: FileText,
      description: translations.dashboard.currentlyActive,
    },
    {
      title: translations.dashboard.monthlyIncome,
      value: `${stats.totalMonthlyIncome.toLocaleString('nb-NO')} kr`,
      icon: DollarSign,
      description: translations.dashboard.totalMonthlyRent,
    },
  ];

  // Redirect to auth if no user after loading
  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-[400px]">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Din session har utløpt. Vennligst logg inn på nytt.</p>
            <Button asChild>
              <Link to="/auth">Logg inn</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="space-y-6 p-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          {translations.dashboard.welcome}, {profile?.full_name || translations.dashboard.user}!
        </h1>
        <p className="text-muted-foreground">
          {translations.dashboard.welcomeMessage}
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant={profile?.subscription_tier === 'pro' ? 'default' : 'secondary'}>
            {profile?.subscription_tier === 'pro' ? translations.dashboard.proPlan : translations.dashboard.freePlan}
          </Badge>
          <CreditsBar />
          {profile?.subscription_tier === 'free' && (
            <Button asChild variant="outline" size="sm">
              <Link to="/#pricing">
                {translations.dashboard.upgrade}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      {stats.upcomingExpirations > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-destructive" />
              <CardTitle className="text-destructive">
                {translations.dashboard.upcomingExpirations}
              </CardTitle>
            </div>
            <CardDescription>
              {stats.upcomingExpirations} {translations.dashboard.leasesExpiringSoon}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/utleie">{translations.dashboard.viewLeases}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          {translations.dashboard.quickActions}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <Card key={index} className="hover:shadow-medium transition-all hover:scale-105 flex flex-col h-full">
              <CardHeader className="flex-1">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-${action.color}/10 flex-shrink-0`}>
                    <action.icon className={`w-5 h-5 text-${action.color}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base leading-tight">{action.title}</CardTitle>
                    <CardDescription className="text-sm mt-1 leading-relaxed">
                      {action.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button asChild className="w-full">
                  <Link to={action.href}>
                    {action.title}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{translations.dashboard.recentActivity}</CardTitle>
          <CardDescription>
            {translations.dashboard.recentActivityDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{translations.dashboard.noRecentActivity}</p>
          </div>
        </CardContent>
      </Card>
    </div>
    <Footer />
    </>
  );
};

export default Dashboard;