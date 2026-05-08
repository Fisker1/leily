import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Wallet, Building2, Calculator } from "lucide-react";
import { finance, FinanceOverview } from "@/api/client";
import { useState, useEffect } from "react";

const fmt = (n: number) => new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 0 }).format(n);

const Okonomi = () => {
  const [data, setData] = useState<FinanceOverview | null>(null);
  const [loading, setLoading] = useState(true);

  // Simple loan calculator state
  const [loanAmt, setLoanAmt] = useState(3000000);
  const [rate, setRate] = useState(4.5);
  const [years, setYears] = useState(25);

  useEffect(() => {
    finance.overview().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  // Loan calc
  const monthlyRate = rate / 100 / 12;
  const numPayments = years * 12;
  const monthlyPayment = monthlyRate > 0
    ? (loanAmt * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
    : loanAmt / numPayments;
  const totalPaid = monthlyPayment * numPayments;
  const totalInterest = totalPaid - loanAmt;

  if (loading || !data) {
    return <AppShell title="Økonomi"><div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}</div></AppShell>;
  }

  const t = data.totals;

  return (
    <AppShell title="Økonomi" subtitle="Finansiell oversikt">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 h-9">
          <TabsTrigger value="overview" className="text-xs">Oversikt</TabsTrigger>
          <TabsTrigger value="calculator" className="text-xs">Kalkulator</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <S label="Mnd. inntekt" value={`${fmt(t.income)} kr`} icon={<TrendingUp className="h-4 w-4" />} positive />
            <S label="Mnd. kostnader" value={`${fmt(t.costs)} kr`} icon={<TrendingDown className="h-4 w-4" />} />
            <S label="Pengestrøm" value={`${t.cashflow >= 0 ? "+" : ""}${fmt(t.cashflow)} kr`} icon={<Wallet className="h-4 w-4" />} positive={t.cashflow >= 0} />
            <S label="Snitt avkastning" value={`${t.avg_yield.toFixed(1)}%`} icon={<TrendingUp className="h-4 w-4" />} positive={t.avg_yield > 4} />
          </div>

          {/* Portfolio bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Verdi: {fmt(t.portfolio_value)} kr</span>
                <span>Lån: {fmt(t.total_loan)} kr</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${t.portfolio_value > 0 ? Math.min((t.total_loan / t.portfolio_value) * 100, 100) : 0}%` }} />
              </div>
            </CardContent>
          </Card>

          {/* Per property */}
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><Building2 className="h-4 w-4" />Per eiendom</h2>
          {data.properties.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Ingen eiendommer</p>
          ) : (
            <div className="space-y-3">
              {data.properties.map(p => (
                <Card key={p.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between mb-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate">{p.address}</h3>
                        <p className="text-xs text-muted-foreground">{p.city}</p>
                      </div>
                      <span className={`text-sm font-bold ml-2 ${p.cashflow >= 0 ? "text-primary" : "text-destructive"}`}>
                        {p.cashflow >= 0 ? "+" : ""}{fmt(p.cashflow)} kr
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div><span className="text-muted-foreground">Leie</span><p className="font-medium">{fmt(p.monthly_rent)} kr</p></div>
                      <div><span className="text-muted-foreground">Avkastning</span><p className="font-medium">{p.yield_pct}%</p></div>
                      <div><span className="text-muted-foreground">Rente</span><p className="font-medium">{p.interest_rate}%</p></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calculator" className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calculator className="h-4 w-4" />Lånekalkulator</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Slider label="Lånebeløp" value={loanAmt} onChange={setLoanAmt} min={500000} max={15000000} step={100000} format={v => `${fmt(v)} kr`} />
              <Slider label="Rente" value={rate} onChange={setRate} min={1} max={10} step={0.1} format={v => `${v.toFixed(1)}%`} />
              <Slider label="Nedbetalingstid" value={years} onChange={setYears} min={5} max={30} step={1} format={v => `${v} år`} />

              <div className="bg-primary/5 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Månedlig betaling</span>
                  <span className="font-bold text-primary">{fmt(Math.round(monthlyPayment))} kr</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Totalt betalt</span>
                  <span className="font-medium">{fmt(Math.round(totalPaid))} kr</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Totale renter</span>
                  <span className="font-medium text-destructive">{fmt(Math.round(totalInterest))} kr</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
};

function S({ label, value, icon, positive }: { label: string; value: string; icon: React.ReactNode; positive?: boolean }) {
  return (
    <Card><CardContent className="p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className={positive ? "text-primary" : "text-muted-foreground"}>{icon}</span>
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <p className={`text-lg font-bold ${positive === false ? "text-destructive" : ""}`}>{value}</p>
    </CardContent></Card>
  );
}

function Slider({ label, value, onChange, min, max, step, format }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; format: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary" />
    </div>
  );
}

export default Okonomi;
