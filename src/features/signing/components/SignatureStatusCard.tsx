import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, X, AlertCircle } from "lucide-react";

interface SignatureStatusCardProps {
  status: 'pending' | 'landlord_signed' | 'tenant_signed' | 'completed' | 'cancelled' | 'expired';
  landlordSigned: boolean;
  tenantSigned: boolean;
  landlordSignedAt?: string;
  tenantSignedAt?: string;
  landlordName?: string;
  tenantName: string;
  expiresAt?: string;
}

export function SignatureStatusCard({
  status,
  landlordSigned,
  tenantSigned,
  landlordSignedAt,
  tenantSignedAt,
  landlordName = "Utleier",
  tenantName,
  expiresAt,
}: SignatureStatusCardProps) {
  const getStatusBadge = () => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Fullført</Badge>;
      case 'landlord_signed':
      case 'tenant_signed':
        return <Badge className="bg-orange-500">Delvis signert</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Venter på signering</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Kansellert</Badge>;
      case 'expired':
        return <Badge variant="destructive">Utløpt</Badge>;
      default:
        return <Badge variant="outline">Ukjent</Badge>;
    }
  };

  const getSignerIcon = (signed: boolean) => {
    if (signed) {
      return <Check className="h-5 w-5 text-green-500" />;
    }
    return <Clock className="h-5 w-5 text-muted-foreground" />;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('no-NO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpiringSoon = () => {
    if (!expiresAt) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Signeringsstatus</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Landlord signature */}
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
          <div className="flex-shrink-0">
            {getSignerIcon(landlordSigned)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium">{landlordName}</p>
            <p className="text-sm text-muted-foreground">
              {landlordSigned && landlordSignedAt
                ? `Signert ${formatDate(landlordSignedAt)}`
                : 'Venter på signering'}
            </p>
          </div>
        </div>

        {/* Tenant signature */}
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
          <div className="flex-shrink-0">
            {getSignerIcon(tenantSigned)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium">{tenantName}</p>
            <p className="text-sm text-muted-foreground">
              {tenantSigned && tenantSignedAt
                ? `Signert ${formatDate(tenantSignedAt)}`
                : 'Venter på signering'}
            </p>
          </div>
        </div>

        {/* Expiry warning */}
        {expiresAt && status === 'pending' && (
          <div className={`flex items-start gap-2 p-3 rounded-lg border ${
            isExpiringSoon() 
              ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/20' 
              : 'bg-muted'
          }`}>
            {isExpiringSoon() ? (
              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
            ) : (
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            )}
            <div>
              <p className="text-sm font-medium">
                {isExpiringSoon() ? 'Utløper snart!' : 'Gyldig til'}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDate(expiresAt)}
              </p>
            </div>
          </div>
        )}

        {/* Completion message */}
        {status === 'completed' && (
          <div className="flex items-start gap-2 p-3 rounded-lg border bg-green-50 border-green-200 dark:bg-green-950/20">
            <Check className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                Leieavtale fullstendig signert
              </p>
              <p className="text-sm text-green-600 dark:text-green-500">
                Avtalen er nå juridisk bindende og aktiv
              </p>
            </div>
          </div>
        )}

        {/* Cancelled/expired message */}
        {(status === 'cancelled' || status === 'expired') && (
          <div className="flex items-start gap-2 p-3 rounded-lg border bg-destructive/10 border-destructive/20">
            <X className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">
                {status === 'cancelled' ? 'Signeringsprosess kansellert' : 'Signeringsforespørsel utløpt'}
              </p>
              <p className="text-sm text-muted-foreground">
                {status === 'cancelled' 
                  ? 'Du må opprette en ny signeringsforespørsel' 
                  : 'Opprett en ny signeringsforespørsel for å fortsette'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
