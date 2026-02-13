import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/shared/integrations/supabase/client';
import { getTenantsWithMaskedData, logTenantDataAccess } from '@/shared/lib/tenantSecurity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Home, Users, FileText, DollarSign, Calendar, ArrowRight, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '@/shared/components/Navigation';
import MinimalFooter from '@/shared/components/MinimalFooter';
import CreditsBar from '@/features/dashboard/components/CreditsBar';
import { UserRoleBadge } from '@/features/dashboard/components/UserRoleBadge';
// import { RentalCalendar } from '@/components/calendar/RentalCalendar';
// import { useAutoCalendarEvents } from '@/hooks/useAutoCalendarEvents';

interface DashboardStats {
  totalProperties: number;
  totalTenants: number;
  totalActiveLeases: number;
  totalMonthlyIncome: number;
  upcomingExpirations: number;
}

interface ActivityLog {
  id: string;
  action: string;
  table_name: string;
  details: any;
  created_at: string;
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
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Initialize auto calendar events - Hook removed
  // useAutoCalendarEvents();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      if (!user) {
        console.log('No user found, skipping dashboard data fetch');
        return;
      }

      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      console.log('Fetching dashboard data for user:', user.id);

      // Execute queries individually with error handling
      const propertiesResult = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });
      
      if (propertiesResult.error) {
        console.error('Properties query failed:', propertiesResult.error);
      }

      const tenantsResult = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .eq('property_owner_id', user.id);
      
      if (tenantsResult.error) {
        console.error('Tenants query failed:', tenantsResult.error);
      }

      const activeLeasesResult = await supabase
        .from('lease_agreements')
        .select('monthly_rent', { count: 'exact' })
        .eq('status', 'active')
        .eq('property_owner_id', user.id);
      
      if (activeLeasesResult.error) {
        console.error('Active leases query failed:', activeLeasesResult.error);
      }

      const upcomingExpirationsResult = await supabase
        .from('lease_agreements')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('property_owner_id', user.id)
        .lt('end_date', thirtyDaysFromNow.toISOString().split('T')[0]);
      
      if (upcomingExpirationsResult.error) {
        console.error('Upcoming expirations query failed:', upcomingExpirationsResult.error);
      }

      const recentActivityResult = await supabase
        .from('audit_log')
        .select('id, action, table_name, details, created_at')
        .in('table_name', ['properties', 'tenants', 'lease_agreements', 'calculation_history'])
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recentActivityResult.error) {
        console.error('Recent activity query failed:', recentActivityResult.error);
      }

      // Calculate monthly income
      const totalMonthlyIncome = activeLeasesResult.data?.reduce(
        (sum, lease) => sum + (parseFloat(lease.monthly_rent?.toString() || '0')), 
        0
      ) || 0;

      console.log('Dashboard data fetched successfully');

      // Update stats
      setStats({
        totalProperties: propertiesResult.count || 0,
        totalTenants: tenantsResult.count || 0,
        totalActiveLeases: activeLeasesResult.count || 0,
        totalMonthlyIncome,
        upcomingExpirations: upcomingExpirationsResult.count || 0,
      });

      // Update recent activities
      setRecentActivities(recentActivityResult.data || []);

    } catch (error) {
      console.error('Critical error in fetchDashboardData:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityMessage = (activity: ActivityLog) => {
    const { action, table_name, details } = activity;
    
    switch (action) {
      case 'insert':
        if (table_name === 'properties') return 'La til ny eiendom';
        if (table_name === 'lease_agreements') return 'Opprettet nytt leieforhold';
        if (table_name === 'calculation_history') return 'Lagret ny kalkyle';
        if (table_name === 'property_documents') return 'Lastet opp dokument';
        if (table_name === 'tenants') return 'La til ny leietaker';
        return `Opprettet i ${table_name}`;
      case 'update':
        if (table_name === 'properties') return 'Oppdaterte eiendom';
        if (table_name === 'lease_agreements') return 'Oppdaterte leieforhold';
        if (table_name === 'property_documents') return 'Oppdaterte dokument';
        return `Oppdaterte ${table_name}`;
      case 'delete':
        if (table_name === 'properties') return 'Slettet eiendom';
        if (table_name === 'lease_agreements') return 'Slettet leieforhold';
        return `Slettet fra ${table_name}`;
      case 'credits_used':
        return `Brukte ${details?.credits_used || 0} kreditter`;
      default:
        return action;
    }
  };

  const getActivityIcon = (activity: ActivityLog) => {
    const { action, table_name } = activity;
    
    if (table_name === 'properties') return Home;
    if (table_name === 'lease_agreements') return FileText;
    if (table_name === 'calculation_history') return Calculator;
    if (table_name === 'property_documents') return FileText;
    if (table_name === 'tenants') return Users;
    if (action === 'credits_used') return DollarSign;
    
    return FileText;
  };

  const quickActions = [
    {
      title: translations.dashboard.addProperty,
      description: translations.dashboard.addPropertyDesc,
      icon: Plus,
      href: '/portfolio',
      color: 'primary',
    },
    {
      title: translations.dashboard.addTenant,
      description: translations.dashboard.addTenantDesc,
      icon: Users,
      href: '/utleie',
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
          <UserRoleBadge />
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
          {recentActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{translations.dashboard.noRecentActivity}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity) => {
                const Icon = getActivityIcon(activity);
                const timeAgo = new Date(activity.created_at).toLocaleDateString('nb-NO', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                
                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {getActivityMessage(activity)}
                      </p>
                      <p className="text-xs text-muted-foreground">{timeAgo}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Leiekalender
        </h2>
        <div className="p-4 border rounded-lg">
          <p>Calendar component has been temporarily removed.</p>
        </div>
      </div>
    </div>
    <MinimalFooter />
    </>
  );
};

export default Dashboard;