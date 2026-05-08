import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Wallet, Building2, Calculator } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/shared/integrations/supabase/client";
import { useState, useEffect } from "react";
import { formatNumberWithSpaces } from "@/shared/lib/utils";
import { SimpleLoanCalculator } from "@/features/calculator/components/SimpleLoanCalculator";

interface PropertyFinance {
  id: string;
  address: string;
  city?: string;
  monthly_rent: number;
  purchase_price: number;
  current_value: number;
  loan_amount: number;
  interest_rate: number;
  monthly_cost: number;
  cashflow: number;
  yield_pct: number;
}

const Okonomi = () => {
  const { user } = useAuth();
  const [finances, setFinances] = useState<PropertyFinance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchFinances();
  }, [user]);

  const fetchFinances = async () => {
    if (!user) return;
    try {
      const { data: properties } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", user.id);

      // Get active lease rents
      const { data: leases } = await supabase
        .from("lease_agreements")
        .select("property_id, monthly_rent")
        .eq("owner_id", user.id)
        .eq("status", "active");

      const leaseMap = new Map(leases?.map(l => [l.property_id, l.monthly_rent]) || []);

      const fin: PropertyFinance[] = (properties || []).map(p => {
        const rent = leaseMap.get(p.id) || p.monthly_rent || 0;
        const loanAmount = p.loan_amount || 0;
        const rate = p.interest_rate || 3.5;
        const monthlyInterest = (loanAmount * (rate / 100)) / 12;
        const estimatedMonthlyCost = monthlyInterest + (rent * 0.15); // 15% overhead estimate
        const cashflow = rent - estimatedMonthlyCost;
        const value = p.current_value || p.purchase_price || 0;
        const yieldPct = value > 0 ? ((rent * 12) / value) * 100 : 0;

        return {
          id: p.id,
          address: p.address,
          city: p.city || "",
          monthly_rent: rent,
          purchase_price: p.purchase_price || 0,
          current_value: value,
          loan_amount: loanAmount,
          interest_rate: rate,
          monthly_cost: estimatedMonthlyCost,
          cashflow,
          yield_pct: yieldPct,
        };
      });

      setFinances(fin);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalRent = finances.reduce((s, f) => s + f.monthly_rent, 0);
  const totalCosts = finances.reduce((s, f) => s + f.monthly_cost, 0);
  const totalCashflow = totalRent - totalCosts;
  const totalValue = finances.reduce((s, f) => s + f.current_value, 0);
  const totalLoan = finances.reduce((s, f) => s + f.loan_amount, 0);
  const avgYield = finances.length > 0 ? finances.reduce((s, f) => s + f.yield_pct, 0) / finances.length : 0;

  if (loading) {
    return (
      <AppShell title="Økonomi">
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Økonomi" subtitle="Finansiell oversikt">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 h-9">
          <TabsTrigger value="overview" className="text-xs">Oversikt</TabsTrigger>
          <TabsTrigger value="calculator" className="text-xs">Kalkulator</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-3">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard
              label="Mnd. inntekt"
              value={`${formatNumberWithSpaces(totalRent)} kr`}
              icon={<TrendingUp className="h-4 w-4" />}
              positive
            />
            <SummaryCard
              label="Mnd. kostnader"
              value={`${formatNumberWithSpaces(Math.round(totalCosts))} kr`}
              icon={<TrendingDown className="h-4 w-4" />}
            />
            <SummaryCard
              label="Pengestrøm"
              value={`${totalCashflow >= 0 ? "+" : ""}${formatNumberWithSpaces(Math.round(totalCashflow))} kr`}
              icon={<Wallet className="h-4 w-4" />}
              positive={totalCashflow >= 0}
            />
            <SummaryCard
              label="Snitt avkastning"
              value={`${avgYield.toFixed(1)}%`}
              icon={<TrendingUp className="h-4 w-4" />}
              positive={avgYield > 4}
            />
          </div>

          {/* Portfolio value */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground font-medium">Porteføljeverdi</span>
                <span className="text-xs text-muted-foreground">Belåning</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">{formatNumberWithSpaces(totalValue)} kr</span>
                <span className="text-sm font-medium text-muted-foreground">
                  {formatNumberWithSpaces(totalLoan)} kr
                  {totalValue > 0 && (
                    <span className="ml-1 text-xs">
                      ({((totalLoan / totalValue) * 100).toFixed(0)}%)
                    </span>
                  )}
                </span>
              </div>
              {totalValue > 0 && (
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min((totalLoan / totalValue) * 100, 100)}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Per-property breakdown */}
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Per eiendom
          </h2>

          {finances.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Ingen eiendommer registrert
            </p>
          ) : (
            <div className="space-y-3">
              {finances.map(f => (
                <Card key={f.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate">{f.address}</h3>
                        <p className="text-xs text-muted-foreground">{f.city}</p>
                      </div>
                      <span className={`text-sm font-bold flex-shrink-0 ml-2 ${f.cashflow >= 0 ? "text-primary" : "text-destructive"}`}>
                        {f.cashflow >= 0 ? "+" : ""}{formatNumberWithSpaces(Math.round(f.cashflow))} kr
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Leie</span>
                        <p className="font-medium">{formatNumberWithSpaces(f.monthly_rent)} kr</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avkastning</span>
                        <p className="font-medium">{f.yield_pct.toFixed(1)}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rente</span>
                        <p className="font-medium">{f.interest_rate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calculator" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Lånekalkulator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleLoanCalculator />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
};

function SummaryCard({
  label,
  value,
  icon,
  positive,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  positive?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className={positive ? "text-primary" : "text-muted-foreground"}>{icon}</span>
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
        </div>
        <p className={`text-lg font-bold ${positive === false ? "text-destructive" : ""}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export default Okonomi;
