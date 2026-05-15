import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Users, Phone, Mail, Shield, ShieldCheck, ShieldAlert,
  ChevronDown, ChevronUp, Building2, Calendar, CreditCard,
  CheckCircle2, Clock, AlertTriangle, Search, UserCheck, UserX,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────
interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  national_id_verified: boolean;
  credit_score: string;
  move_in_date: string;
  lease_id: string;
  property_id: string;
  emergency_contact: string;
  notes: string;
  avatar_color: string;
  employer: string;
  monthly_income: number;
}

interface LeaseAgreement {
  id: string;
  property_id: string;
  tenant_name: string;
  monthly_rent: number;
  deposit_amount: number;
  start_date: string;
  end_date: string | null;
  status: string;
}

interface PropertySummary {
  id: string;
  address: string;
  city: string | null;
}

interface RentPayment {
  id: string;
  lease_id: string;
  property_id: string;
  tenant_name: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: 'paid' | 'pending' | 'overdue';
  payment_method: string | null;
  month_label: string;
}

interface TenantDirectoryProps {
  tenants: Tenant[];
  leases: LeaseAgreement[];
  properties: PropertySummary[];
  rentPayments: RentPayment[];
}

// ─── Helpers ──────────────────────────────────────────────────────────
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('no-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const creditScoreColor = (score: string) => {
  switch (score) {
    case 'A': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'B': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    case 'C': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

const creditScoreLabel = (score: string) => {
  switch (score) {
    case 'A': return 'Utmerket';
    case 'B': return 'God';
    case 'C': return 'Moderat';
    default: return 'Ukjent';
  }
};

// ─── Component ────────────────────────────────────────────────────────
const TenantDirectory = ({ tenants, leases, properties, rentPayments }: TenantDirectoryProps) => {
  const [expandedTenant, setExpandedTenant] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Enrich tenants with lease/property/payment data
  const enrichedTenants = useMemo(() => {
    return tenants.map(tenant => {
      const lease = leases.find(l => l.id === tenant.lease_id);
      const property = properties.find(p => p.id === tenant.property_id);
      const tenantPayments = rentPayments.filter(
        rp => rp.lease_id === tenant.lease_id
      );
      const paidPayments = tenantPayments.filter(rp => rp.status === 'paid');
      const overduePayments = tenantPayments.filter(rp => rp.status === 'overdue');
      const pendingPayments = tenantPayments.filter(rp => rp.status === 'pending');
      const paymentRate = tenantPayments.length > 0
        ? (paidPayments.length / tenantPayments.length) * 100
        : 0;
      const totalPaid = paidPayments.reduce((s, p) => s + p.amount, 0);

      // Calculate average days late for paid payments
      const lateDays = paidPayments
        .filter(p => p.paid_date && p.due_date)
        .map(p => {
          const due = new Date(p.due_date);
          const paid = new Date(p.paid_date!);
          return Math.max(0, Math.floor((paid.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
        });
      const avgLateDays = lateDays.length > 0
        ? lateDays.reduce((a, b) => a + b, 0) / lateDays.length
        : 0;

      // Tenant reliability score (0-100)
      let reliabilityScore = 50;
      reliabilityScore += paymentRate * 0.3; // up to 30 pts
      reliabilityScore += tenant.national_id_verified ? 10 : 0;
      reliabilityScore += tenant.credit_score === 'A' ? 10 : tenant.credit_score === 'B' ? 5 : 0;
      reliabilityScore -= avgLateDays * 2; // penalty for late payments
      reliabilityScore -= overduePayments.length * 5;
      reliabilityScore = Math.max(0, Math.min(100, Math.round(reliabilityScore)));

      return {
        ...tenant,
        lease,
        property,
        tenantPayments,
        paidPayments,
        overduePayments,
        pendingPayments,
        paymentRate,
        totalPaid,
        avgLateDays,
        reliabilityScore,
        isActive: lease?.status === 'active',
      };
    });
  }, [tenants, leases, properties, rentPayments]);

  // Summary stats
  const summary = useMemo(() => {
    const active = enrichedTenants.filter(t => t.isActive);
    const avgScore = active.length > 0
      ? active.reduce((s, t) => s + t.reliabilityScore, 0) / active.length
      : 0;
    const verified = active.filter(t => t.national_id_verified).length;
    const totalMonthlyIncome = active.reduce((s, t) => s + (t.lease?.monthly_rent || 0), 0);
    const totalDeposits = active.reduce((s, t) => s + (t.lease?.deposit_amount || 0), 0);
    return {
      total: enrichedTenants.length,
      active: active.length,
      inactive: enrichedTenants.length - active.length,
      avgScore: Math.round(avgScore),
      verified,
      unverified: active.length - verified,
      totalMonthlyIncome,
      totalDeposits,
    };
  }, [enrichedTenants]);

  // Filtered tenants
  const filteredTenants = useMemo(() => {
    let result = enrichedTenants;
    if (statusFilter === 'active') result = result.filter(t => t.isActive);
    if (statusFilter === 'inactive') result = result.filter(t => !t.isActive);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.property?.address.toLowerCase().includes(q) ||
        t.property?.city?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [enrichedTenants, statusFilter, searchQuery]);

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const scoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktive leietakere</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.active}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.inactive} tidligere leietakere
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Snitt pålitelighet</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${scoreColor(summary.avgScore)}`}>{summary.avgScore}/100</div>
            <p className="text-xs text-muted-foreground mt-1">
              Basert på betalingshistorikk
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ID-verifisert</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.verified}/{summary.active}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.unverified > 0 ? `${summary.unverified} mangler verifisering` : 'Alle verifisert'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Depositumsaldo</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalDeposits)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total innbetalt depositum
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Leietakeroversikt
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Administrer leietakere, se betalingshistorikk og pålitelighetsscorer
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Søk leietaker..."
                  className="pl-8 pr-3 py-2 text-sm border rounded-md bg-background w-[180px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="active">Aktive</SelectItem>
                  <SelectItem value="inactive">Tidligere</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredTenants.map(tenant => (
            <div
              key={tenant.id}
              className="border rounded-lg overflow-hidden"
            >
              {/* Tenant row */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedTenant(expandedTenant === tenant.id ? null : tenant.id)}
              >
                {/* Avatar */}
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                  style={{ backgroundColor: tenant.avatar_color }}
                >
                  {tenant.name.split(' ').map(n => n[0]).join('')}
                </div>

                {/* Name & property */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{tenant.name}</span>
                    {tenant.isActive ? (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0">Aktiv</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Avsluttet</Badge>
                    )}
                    {tenant.national_id_verified ? (
                      <UserCheck className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <UserX className="h-3.5 w-3.5 text-amber-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {tenant.property?.address}{tenant.property?.city ? `, ${tenant.property.city}` : ''}
                  </p>
                </div>

                {/* Credit score */}
                <div className="hidden sm:block">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${creditScoreColor(tenant.credit_score)}`}>
                    Kreditt: {tenant.credit_score} ({creditScoreLabel(tenant.credit_score)})
                  </span>
                </div>

                {/* Payment rate */}
                <div className="hidden md:flex items-center gap-2 w-[140px]">
                  <div className="flex-1">
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${scoreBarColor(tenant.reliabilityScore)}`}
                        style={{ width: `${tenant.reliabilityScore}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-xs font-semibold w-8 text-right ${scoreColor(tenant.reliabilityScore)}`}>
                    {tenant.reliabilityScore}
                  </span>
                </div>

                {/* Rent */}
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold">{tenant.lease ? formatCurrency(tenant.lease.monthly_rent) : '-'}</p>
                  <p className="text-[10px] text-muted-foreground">pr. mnd</p>
                </div>

                <div>
                  {expandedTenant === tenant.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {expandedTenant === tenant.id && (
                <div className="border-t bg-muted/10 p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Contact info */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kontaktinformasjon</h4>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{tenant.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{tenant.phone}</span>
                        </div>
                        {tenant.emergency_contact && (
                          <div className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium">Nødkontakt:</span> {tenant.emergency_contact}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lease details */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leieforhold</h4>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{tenant.property?.address || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>
                            {new Date(tenant.move_in_date).toLocaleDateString('no-NO')}
                            {tenant.lease?.end_date && ` → ${new Date(tenant.lease.end_date).toLocaleDateString('no-NO')}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Depositum: {tenant.lease ? formatCurrency(tenant.lease.deposit_amount || 0) : '-'}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Arbeidsgiver:</span> {tenant.employer}
                        </div>
                      </div>
                    </div>

                    {/* Payment stats */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Betalingsstatistikk</h4>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Betalingsrate:</span>
                          <span className="font-medium">{tenant.paymentRate.toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Totalt betalt:</span>
                          <span className="font-medium">{formatCurrency(tenant.totalPaid)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Snitt forsinkelse:</span>
                          <span className={`font-medium ${tenant.avgLateDays > 5 ? 'text-red-600' : 'text-green-600'}`}>
                            {tenant.avgLateDays.toFixed(1)} dager
                          </span>
                        </div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            {tenant.paidPayments.length} betalt
                          </Badge>
                          {tenant.pendingPayments.length > 0 && (
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <Clock className="h-3 w-3 text-amber-500" />
                              {tenant.pendingPayments.length} ventende
                            </Badge>
                          )}
                          {tenant.overduePayments.length > 0 && (
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <AlertTriangle className="h-3 w-3 text-red-500" />
                              {tenant.overduePayments.length} forfalt
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent payments table */}
                  {tenant.tenantPayments.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Siste betalinger
                      </h4>
                      <div className="max-h-[200px] overflow-y-auto rounded border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Måned</TableHead>
                              <TableHead className="text-xs">Beløp</TableHead>
                              <TableHead className="text-xs">Forfallsdato</TableHead>
                              <TableHead className="text-xs">Betalt</TableHead>
                              <TableHead className="text-xs">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tenant.tenantPayments.slice(0, 6).map(payment => (
                              <TableRow key={payment.id}>
                                <TableCell className="text-xs">{payment.month_label}</TableCell>
                                <TableCell className="text-xs font-medium">{formatCurrency(payment.amount)}</TableCell>
                                <TableCell className="text-xs">{new Date(payment.due_date).toLocaleDateString('no-NO')}</TableCell>
                                <TableCell className="text-xs">{payment.paid_date ? new Date(payment.paid_date).toLocaleDateString('no-NO') : '-'}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={payment.status === 'paid' ? 'default' : payment.status === 'pending' ? 'secondary' : 'destructive'}
                                    className="text-[10px]"
                                  >
                                    {payment.status === 'paid' ? 'Betalt' : payment.status === 'pending' ? 'Ventende' : 'Forfalt'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {tenant.notes && (
                    <div className="text-xs text-muted-foreground bg-muted/40 rounded p-2">
                      <span className="font-medium">Notater:</span> {tenant.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {filteredTenants.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ingen leietakere funnet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantDirectory;
