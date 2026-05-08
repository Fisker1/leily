import AppShell from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Wallet, TrendingUp, AlertTriangle, Clock, FileText } from "lucide-react";
import { dashboard, DashboardStats } from "@/api/client";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const fmt = (n: number) =>
  new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 0 }).format(n);

const Oversikt = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboard.stats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
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
    <AppShell title="Oversikt" subtitle={`${stats.properties} eiendommer`}>
      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Metric icon={<Building2 className="h-4 w-4" />} label="Eiendommer" value={String(stats.properties)} color="primary" />
        <Metric icon={<Users className="h-4 w-4" />} label="Leietakere" value={String(stats.tenants)} color="accent" />
        <Metric icon={<Wallet className="h-4 w-4" />} label="Mnd. inntekt" value={`${fmt(stats.monthlyIncome)} kr`} color="primary" />
        <Metric icon={<TrendingUp className="h-4 w-4" />} label="Belegg" value={`${stats.occupancy.toFixed(0)}%`} color="accent" />
      </div>

      {/* Equity bar */}
      {stats.totalValue > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Porteføljeverdi: {fmt(stats.totalValue)} kr</span>
              <span>Lån: {fmt(stats.totalLoan)} kr</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${Math.min((stats.totalLoan / stats.totalValue) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Egenkapital: {fmt(stats.equity)} kr ({((stats.equity / stats.totalValue) * 100).toFixed(0)}%)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Expiring leases */}
      {stats.expiringLeases.length > 0 && (
        <Card className="mb-6 border-orange-300 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-semibold text-orange-800 dark:text-orange-200">Utløper snart</span>
            </div>
            {stats.expiringLeases.map(l => (
              <div key={l.id} className="flex justify-between text-sm mb-1">
                <div>
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

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <QuickLink to="/eiendommer" icon={<Building2 />} label="Eiendommer" sub="Administrer" />
        <QuickLink to="/kontrakter" icon={<FileText />} label="Kontrakter" sub="Opprett ny" />
      </div>

      {/* Empty state */}
      {stats.properties === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Kom i gang</h3>
            <p className="text-sm text-muted-foreground mb-4">Legg til din første eiendom</p>
            <Link to="/eiendommer" className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              Legg til eiendom
            </Link>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
};

function Metric({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: "primary" | "accent" }) {
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

function QuickLink({ to, icon, label, sub }: { to: string; icon: React.ReactNode; label: string; sub: string }) {
  return (
    <Link to={to}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
          <div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default Oversikt;
