import AppShell from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Wallet, TrendingUp, AlertTriangle, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/shared/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatNumberWithSpaces } from "@/shared/lib/utils";

interface DashboardStats {
  totalProperties: number;
  totalTenants: number;
  activeLeases: number;
  monthlyIncome: number;
  occupancyRate: number;
  expiringLeases: Array<{
    id: string;
    end_date: string;
    property_address: string;
    tenant_name: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    created_at: string;
    details?: string;
  }>;
}

const Oversikt = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    totalTenants: 0,
    activeLeases: 0,
    monthlyIncome: 0,
    occupancyRate: 0,
    expiringLeases: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    try {
      // Fetch properties
      const { data: properties } = await supabase
        .from("properties")
        .select("id, address, city, monthly_rent")
        .eq("owner_id", user.id);

      // Fetch active leases with tenant + property info
      const { data: leases } = await supabase
        .from("lease_agreements")
        .select("id, monthly_rent, start_date, end_date, status, property_id, tenant_id")
        .eq("owner_id", user.id)
        .eq("status", "active");

      // Fetch tenants
      const { data: tenants } = await supabase
        .from("tenants")
        .select("id, first_name, last_name")
        .eq("owner_id", user.id);

      const totalProperties = properties?.length || 0;
      const activeLeases = leases?.length || 0;
      const monthlyIncome = leases?.reduce((sum, l) => sum + (l.monthly_rent || 0), 0) || 0;
      const occupancyRate = totalProperties > 0 ? (activeLeases / totalProperties) * 100 : 0;

      // Find leases expiring within 60 days
      const now = new Date();
      const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      const expiring = (leases || [])
        .filter(l => {
          const end = new Date(l.end_date);
          return end >= now && end <= in60Days;
        })
        .map(l => {
          const prop = properties?.find(p => p.id === l.property_id);
          const tenant = tenants?.find(t => t.id === l.tenant_id);
          return {
            id: l.id,
            end_date: l.end_date,
            property_address: prop ? `${prop.address}, ${prop.city || ""}` : "Ukjent",
            tenant_name: tenant ? `${tenant.first_name} ${tenant.last_name}` : "Ukjent",
          };
        });

      // Recent audit log
      const { data: activity } = await supabase
        .from("audit_log")
        .select("id, action, created_at, details")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setStats({
        totalProperties,
        totalTenants: tenants?.length || 0,
        activeLeases,
        monthlyIncome,
        occupancyRate,
        expiringLeases: expiring,
        recentActivity: (activity || []).map(a => ({
          id: a.id,
          action: a.action,
          created_at: a.created_at,
          details: typeof a.details === 'string' ? a.details : JSON.stringify(a.details),
        })),
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Oversikt">
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Oversikt" subtitle={`${stats.totalProperties} eiendommer`}>
      {/* Key metrics — 2x2 grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <MetricCard
          icon={<Building2 className="h-4 w-4" />}
          label="Eiendommer"
          value={stats.totalProperties.toString()}
          color="primary"
        />
        <MetricCard
          icon={<Users className="h-4 w-4" />}
          label="Leietakere"
          value={stats.totalTenants.toString()}
          color="accent"
        />
        <MetricCard
          icon={<Wallet className="h-4 w-4" />}
          label="Mnd. inntekt"
          value={`${formatNumberWithSpaces(stats.monthlyIncome)} kr`}
          color="primary"
        />
        <MetricCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Belegg"
          value={`${stats.occupancyRate.toFixed(0)}%`}
          color="accent"
        />
      </div>

      {/* Expiring leases warning */}
      {stats.expiringLeases.length > 0 && (
        <Card className="mb-6 border-orange-300 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                Utløper snart
              </span>
            </div>
            <div className="space-y-2">
              {stats.expiringLeases.map(lease => (
                <div key={lease.id} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{lease.property_address}</p>
                    <p className="text-xs text-muted-foreground">{lease.tenant_name}</p>
                  </div>
                  <Badge variant="outline" className="text-orange-700 border-orange-300 flex-shrink-0 ml-2">
                    {new Date(lease.end_date).toLocaleDateString("nb-NO")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link to="/eiendommer">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Eiendommer</p>
                <p className="text-xs text-muted-foreground">Administrer</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/kontrakter">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Kontrakter</p>
                <p className="text-xs text-muted-foreground">Opprett ny</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent activity */}
      {stats.recentActivity.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Siste aktivitet
          </h2>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {stats.recentActivity.map(activity => (
                <div key={activity.id} className="px-4 py-3">
                  <p className="text-sm font-medium">{formatAction(activity.action)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.created_at).toLocaleDateString("nb-NO", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty state */}
      {stats.totalProperties === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Kom i gang</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Legg til din første eiendom for å begynne
            </p>
            <Link
              to="/eiendommer"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Legg til eiendom
            </Link>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
};

function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "primary" | "accent";
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className={color === "primary" ? "text-primary" : "text-accent"}>{icon}</span>
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
        </div>
        <p className="text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function formatAction(action: string): string {
  const map: Record<string, string> = {
    sign_in: "Logget inn",
    sign_out: "Logget ut",
    property_created: "Eiendom lagt til",
    property_updated: "Eiendom oppdatert",
    lease_created: "Kontrakt opprettet",
    lease_updated: "Kontrakt oppdatert",
    tenant_added: "Leietaker lagt til",
    payment_recorded: "Betaling registrert",
  };
  return map[action] || action;
}

export default Oversikt;
