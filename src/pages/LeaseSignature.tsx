import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignatureStatusCard } from "@/components/signing/SignatureStatusCard";
import { SignatureTimeline } from "@/components/signing/SignatureTimeline";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileSignature,
  Download,
  ArrowLeft,
  ExternalLink,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

export default function LeaseSignature() {
  const { leaseId } = useParams<{ leaseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lease, setLease] = useState<any>(null);
  const [signature, setSignature] = useState<any>(null);
  const [landlordProfile, setLandlordProfile] = useState<any>(null);

  useEffect(() => {
    if (!user || !leaseId) {
      navigate('/auth');
      return;
    }

    fetchLeaseAndSignature();

    // Set up realtime subscription for signature updates
    const channel = supabase
      .channel('signature-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lease_signatures',
          filter: `lease_id=eq.${leaseId}`,
        },
        (payload) => {
          console.log('Signature updated:', payload);
          setSignature(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leaseId, user, navigate]);

  const fetchLeaseAndSignature = async () => {
    try {
      setLoading(true);

      // Fetch lease with related data
      const { data: leaseData, error: leaseError } = await supabase
        .from('lease_agreements')
        .select(`
          *,
          property:properties(*),
          tenant:tenants(*)
        `)
        .eq('id', leaseId)
        .eq('property_owner_id', user!.id)
        .single();

      if (leaseError) throw leaseError;
      setLease(leaseData);

      // Fetch signature data
      const { data: signatureData, error: signatureError } = await supabase
        .from('lease_signatures')
        .select('*')
        .eq('lease_id', leaseId)
        .maybeSingle();

      if (signatureError && signatureError.code !== 'PGRST116') {
        throw signatureError;
      }

      setSignature(signatureData);

      // Fetch landlord profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user!.id)
        .single();

      setLandlordProfile(profileData);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Kunne ikke hente leieavtaledata', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignNow = () => {
    if (signature?.landlord_signing_url) {
      window.location.href = signature.landlord_signing_url;
    } else {
      toast.error('Signeringslenke ikke funnet');
    }
  };

  const handleDownloadSigned = async () => {
    if (!signature?.signed_pdf_url) {
      toast.error('Signert dokument er ikke tilgjengelig ennå');
      return;
    }

    // TODO: Download signed PDF from Supabase Storage
    toast.info('Last ned-funksjonalitet kommer snart');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Leieavtale ikke funnet eller du har ikke tilgang til den.
          </AlertDescription>
        </Alert>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/rental">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tilbake til oversikt
          </Link>
        </Button>
      </div>
    );
  }

  const property = lease.property;
  const tenant = lease.tenant;
  const tenantName = `${tenant.first_name} ${tenant.last_name}`;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link to="/rental">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tilbake til oversikt
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Leieavtale - Signering</h1>
            <p className="text-muted-foreground">
              {property.address}, {property.postal_code} {property.city}
            </p>
          </div>
          <FileSignature className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Property Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Eiendomsinfo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Adresse:</span>
                <span className="font-medium">{property.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Størrelse:</span>
                <span className="font-medium">{property.size_sqm} m²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Månedsleie:</span>
                <span className="font-medium">
                  {Number(lease.monthly_rent).toLocaleString('no-NO')} kr
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Leietaker:</span>
                <span className="font-medium">{tenantName}</span>
              </div>
            </CardContent>
          </Card>

          {/* Signature Status */}
          {signature ? (
            <SignatureStatusCard
              status={signature.status}
              landlordSigned={signature.landlord_signed}
              tenantSigned={signature.tenant_signed}
              landlordSignedAt={signature.landlord_signed_at}
              tenantSignedAt={signature.tenant_signed_at}
              landlordName={landlordProfile?.full_name}
              tenantName={tenantName}
              expiresAt={signature.expires_at}
            />
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Leieavtalen er ikke sendt til signering ennå.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {signature?.status === 'pending' && !signature.landlord_signed && (
              <Button onClick={handleSignNow} className="w-full" size="lg">
                <FileSignature className="mr-2 h-5 w-5" />
                Signer med BankID
              </Button>
            )}

            {signature?.status === 'landlord_signed' && (
              <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20">
                <AlertDescription>
                  Du har signert avtalen. Venter på at {tenantName} skal signere.
                </AlertDescription>
              </Alert>
            )}

            {signature?.status === 'completed' && (
              <>
                <Button onClick={handleDownloadSigned} className="w-full" size="lg">
                  <Download className="mr-2 h-5 w-5" />
                  Last ned signert avtale
                </Button>
                <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20">
                  <AlertDescription>
                    Leieavtalen er fullstendig signert og juridisk bindende! 🎉
                  </AlertDescription>
                </Alert>
              </>
            )}

            {signature?.landlord_signing_url && signature.status !== 'completed' && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(signature.landlord_signing_url, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Åpne signeringslenke
              </Button>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Timeline */}
          {signature && (
            <SignatureTimeline
              createdAt={lease.created_at}
              signatureInitiatedAt={signature.created_at}
              landlordSignedAt={signature.landlord_signed_at}
              tenantSignedAt={signature.tenant_signed_at}
              completedAt={
                signature.status === 'completed'
                  ? signature.updated_at
                  : undefined
              }
              landlordName={landlordProfile?.full_name}
              tenantName={tenantName}
            />
          )}

          {/* Help Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Trenger du hjelp?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Hvis du har problemer med signeringen eller spørsmål om leieavtalen,
                kan du kontakte oss.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/utleie-agent">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat med support
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* BankID Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Om BankID-signering:</strong>
              <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                <li>Bruk din vanlige BankID (mobil eller kodebrikke)</li>
                <li>Signeringen tar vanligvis under 2 minutter</li>
                <li>Avtalen er juridisk bindende når begge har signert</li>
                <li>Du får e-post når leietaker har signert</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
