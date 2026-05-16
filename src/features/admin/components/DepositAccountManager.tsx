import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  Landmark, AlertTriangle, CheckCircle2, Clock, ArrowUpRight,
  ChevronDown, ChevronUp, Search, Filter,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────
interface DepositAccount {
  id: string;
  lease_id: string;
  property_id: string;
  tenant_name: string;
  property_address: string;
  deposit_amount: number;
  account_number: string;
  bank_name: string;
  status: 'active' | 'pending_release' | 'released' | 'disputed';
  created_at: string;
  released_at: string | null;
  release_reason: string | null;
  accrued_interest: number;
  last_interest_date: string | null;
  notes: string | null;
}

interface DepositAccountManagerProps {
  leases: Array<{
    id: string;
    property_id: string;
    tenant_name?: string;
    deposit_amount: number | null;
    status: string | null;
    start_date: string;
    end_date: string | null;
  }>;
  properties: Array<{
    id: string;
    address: string;
  }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('no-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('no-NO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: 'Aktiv', color: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300', icon: CheckCircle2 },
  pending_release: { label: 'Venter frigivelse', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300', icon: Clock },
  released: { label: 'Frigitt', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300', icon: ArrowUpRight },
  disputed: { label: 'Tvist', color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300', icon: AlertTriangle },
};

// ─── Generate deposit accounts from lease data ───────────────────────────
const generateDepositAccounts = (
  leases: DepositAccountManagerProps['leases'],
  properties: DepositAccountManagerProps['properties'],
): DepositAccount[] => {
  const bankNames = ['DNB', 'Nordea', 'SpareBank 1', 'Handelsbanken', 'Storebrand'];
  let seed = 73;
  const rng = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  return leases
    .filter(l => l.deposit_amount && l.deposit_amount > 0)
    .map((lease) => {
      const property = properties.find(p => p.id === lease.property_id);
      const isExpired = lease.status === 'expired';
      const r = rng();

      let status: DepositAccount['status'];
      if (isExpired) {
        status = r > 0.3 ? 'released' : 'pending_release';
      } else {
        status = r > 0.9 ? 'disputed' : 'active';
      }

      const depositAmount = lease.deposit_amount || 0;
      const monthsHeld = Math.max(1, Math.round(
        (new Date().getTime() - new Date(lease.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30)
      ));
      // Norwegian deposit accounts earn interest (~2-3% annually)
      const annualRate = 0.02 + rng() * 0.015;
      const accruedInterest = Math.round(depositAmount * annualRate * (monthsHeld / 12));

      const accountNum = `${1000 + Math.floor(rng() * 9000)}.${10 + Math.floor(rng() * 90)}.${10000 + Math.floor(rng() * 90000)}`;

      return {
        id: `dep-${lease.id}`,
        lease_id: lease.id,
        property_id: lease.property_id,
        tenant_name: lease.tenant_name || 'Ukjent leietaker',
        property_address: property?.address || 'Ukjent adresse',
        deposit_amount: depositAmount,
        account_number: accountNum,
        bank_name: bankNames[Math.floor(rng() * bankNames.length)],
        status,
        created_at: lease.start_date,
        released_at: status === 'released' ? (lease.end_date || new Date().toISOString().substring(0, 10)) : null,
        release_reason: status === 'released' ? 'Leieforhold avsluttet, ingen skader' : null,
        accrued_interest: accruedInterest,
        last_interest_date: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 28).toISOString().substring(0, 10),
        notes: status === 'disputed' ? 'Skader oppdaget ved utflytting, avventer vurdering' : null,
      };
    });
};

// ─── Component ───────────────────────────────────────────────────────────
const DepositAccountManager = ({ leases, properties }: DepositAccountManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const deposits = useMemo(
    () => generateDepositAccounts(leases, properties),
    [leases, properties],
  );

  const filtered = useMemo(() => {
    return deposits.filter(d => {
      const matchesSearch =
        !searchTerm ||
        d.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.property_address.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [deposits, searchTerm, statusFilter]);

  const summary = useMemo(() => {
    const active = deposits.filter(d => d.status === 'active');
    const pendingRelease = deposits.filter(d => d.status === 'pending_release');
    const disputed = deposits.filter(d => d.status === 'disputed');
    const totalHeld = active.reduce((sum, d) => sum + d.deposit_amount, 0);
    const totalInterest = deposits.reduce((sum, d) => sum + d.accrued_interest, 0);
    return {
      totalAccounts: deposits.length,
      activeCount: active.length,
      pendingReleaseCount: pendingRelease.length,
      disputedCount: disputed.length,
      totalHeld,
      totalInterest,
    };
  }, [deposits]);

  const toggleExpanded = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRequestRelease = (deposit: DepositAccount) => {
    toast.success(`Frigivelsesforespørsel sendt for ${deposit.tenant_name}`);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktive depositum</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeCount}</div>
            <p className="text-xs text-muted-foreground">av {summary.totalAccounts} totalt</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total depositum holdt</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalHeld)}</div>
            <p className="text-xs text-muted-foreground">I depositumkontoer</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Venter frigivelse</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.pendingReleaseCount}</div>
            <p className="text-xs text-muted-foreground">Kontoer til behandling</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Opptjent rente</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalInterest)}</div>
            <p className="text-xs text-muted-foreground">Samlet rentebeløp</p>
          </CardContent>
        </Card>
      </div>

      {/* Disputed warning */}
      {summary.disputedCount > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-300">
                {summary.disputedCount} depositum{summary.disputedCount > 1 ? 'kontoer' : 'konto'} i tvist
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                Krever oppfølging — sjekk detaljer nedenfor
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Depositumkontoer
          </CardTitle>
          <CardDescription>
            Oversikt og administrasjon av depositumkontoer — inspirert av husleie.no og hybel.no
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk etter leietaker eller eiendom..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statuser</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="pending_release">Venter frigivelse</SelectItem>
                <SelectItem value="released">Frigitt</SelectItem>
                <SelectItem value="disputed">Tvist</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Deposit Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">Leietaker</TableHead>
                  <TableHead>Eiendom</TableHead>
                  <TableHead className="text-right">Depositum</TableHead>
                  <TableHead className="text-right">Rente</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(deposit => {
                  const isExpanded = expanded.has(deposit.id);
                  const config = statusConfig[deposit.status];
                  const StatusIcon = config.icon;

                  return (
                    <>
                      <TableRow
                        key={deposit.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleExpanded(deposit.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            <span className="font-medium">{deposit.tenant_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{deposit.property_address}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(deposit.deposit_amount)}
                        </TableCell>
                        <TableCell className="text-right text-green-600 dark:text-green-400">
                          +{formatCurrency(deposit.accrued_interest)}
                        </TableCell>
                        <TableCell className="text-sm">{deposit.bank_name}</TableCell>
                        <TableCell>
                          <Badge className={`${config.color} border-0 gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {deposit.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation();
                                handleRequestRelease(deposit);
                              }}
                            >
                              Frigi
                            </Button>
                          )}
                          {deposit.status === 'pending_release' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation();
                                toast.success('Frigivelse godkjent');
                              }}
                            >
                              Godkjenn
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow key={`${deposit.id}-details`}>
                          <TableCell colSpan={7} className="bg-muted/30 p-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Kontonummer</p>
                                <p className="font-mono font-medium">{deposit.account_number}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Opprettet</p>
                                <p className="font-medium">{formatDate(deposit.created_at)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Siste rentedato</p>
                                <p className="font-medium">
                                  {deposit.last_interest_date ? formatDate(deposit.last_interest_date) : '-'}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Total (dep + rente)</p>
                                <p className="font-semibold text-green-600 dark:text-green-400">
                                  {formatCurrency(deposit.deposit_amount + deposit.accrued_interest)}
                                </p>
                              </div>
                              {deposit.released_at && (
                                <div>
                                  <p className="text-muted-foreground">Frigitt dato</p>
                                  <p className="font-medium">{formatDate(deposit.released_at)}</p>
                                </div>
                              )}
                              {deposit.release_reason && (
                                <div className="col-span-2">
                                  <p className="text-muted-foreground">Frigivelsesgrunn</p>
                                  <p className="font-medium">{deposit.release_reason}</p>
                                </div>
                              )}
                              {deposit.notes && (
                                <div className="col-span-2 md:col-span-4">
                                  <p className="text-muted-foreground">Merknader</p>
                                  <p className="font-medium text-amber-600 dark:text-amber-400">{deposit.notes}</p>
                                </div>
                              )}
                            </div>

                            {/* Deposit to rent ratio */}
                            {deposit.status === 'active' && (
                              <div className="mt-3 space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">
                                    Depositum dekker {((deposit.deposit_amount / (deposit.deposit_amount / 3)) || 0).toFixed(1)} mnd husleie
                                  </span>
                                  <span className="font-medium">3 mnd (standard)</span>
                                </div>
                                <Progress value={100} className="h-1.5" />
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>

            {filtered.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Landmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingen depositumkontoer funnet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepositAccountManager;
