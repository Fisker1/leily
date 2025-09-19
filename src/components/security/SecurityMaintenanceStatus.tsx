import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Clock, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';

interface SecurityStatus {
  feature: string;
  status: 'ACTIVE' | 'INACTIVE' | 'WARNING' | 'ERROR';
  description: string;
  lastCheck?: string;
  actionRequired?: string;
}

export const SecurityMaintenanceStatus: React.FC = () => {
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastMaintenance, setLastMaintenance] = useState<string | null>(null);

  const fetchSecurityStatus = async () => {
    try {
      // Get security status summary
      const { data: statusData, error: statusError } = await supabase
        .rpc('get_security_status_summary');

      if (statusError) {
        console.error('Error fetching security status:', statusError);
        return;
      }

      const formattedStatus: SecurityStatus[] = statusData?.map((item: any) => ({
        feature: item.security_feature,
        status: item.requires_manual_config ? 'WARNING' : 'ACTIVE',
        description: item.description,
        actionRequired: item.requires_manual_config ? 'Manual configuration required' : undefined
      })) || [];

      setSecurityStatus(formattedStatus);

      // Get last maintenance run
      const { data: auditData } = await supabase
        .from('audit_log')
        .select('created_at')
        .eq('action', 'AUTOMATED_SECURITY_CLEANUP')
        .order('created_at', { ascending: false })
        .limit(1);

      if (auditData && auditData.length > 0) {
        setLastMaintenance(auditData[0].created_at);
      }

    } catch (error) {
      console.error('Error fetching security status:', error);
      toast({
        title: 'Feil',
        description: 'Kunne ikke hente sikkerhetsstatus',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const runSecurityMaintenance = async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      await supabase.rpc('enhanced_security_cleanup');
      
      toast({
        title: 'Sikkerhetsvedlikehold fullført',
        description: 'Automatisk opprydding av sikkerhetsdataene er utført',
      });

      // Refresh status
      await fetchSecurityStatus();
    } catch (error) {
      console.error('Security maintenance error:', error);
      toast({
        title: 'Vedlikeholdsfeil',
        description: 'Kunne ikke utføre sikkerhetsvedlikehold',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityStatus();
  }, []);

  const getStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'WARNING':
        return 'outline';
      case 'ERROR':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4" />;
      case 'ERROR':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Sikkerhetsstatus</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p>Laster sikkerhetsstatus...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Sikkerhetsstatus</CardTitle>
            </div>
            {isAdmin && (
              <Button
                onClick={runSecurityMaintenance}
                disabled={loading}
                size="sm"
                variant="outline"
              >
                <Settings className="h-4 w-4 mr-2" />
                Kjør vedlikehold
              </Button>
            )}
          </div>
          <CardDescription>
            Oversikt over systemets sikkerhetsfunksjoner og deres status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {securityStatus.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(item.status)}
                <div>
                  <h4 className="font-medium">{item.feature}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  {item.actionRequired && (
                    <p className="text-sm text-warning font-medium mt-1">{item.actionRequired}</p>
                  )}
                </div>
              </div>
              <Badge variant={getStatusColor(item.status)}>
                {item.status === 'ACTIVE' ? 'Aktiv' : 
                 item.status === 'WARNING' ? 'Advarsel' : 
                 item.status === 'ERROR' ? 'Feil' : 'Ukjent'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {lastMaintenance && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <CardTitle>Siste vedlikehold</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Siste automatiske sikkerhetsvedlikehold: {new Date(lastMaintenance).toLocaleString('no-NO')}
            </p>
          </CardContent>
        </Card>
      )}

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Viktig:</strong> For full sikkerhet må du aktivere "Leaked Password Protection" 
          i Supabase Dashboard under Authentication → Settings. Dette forhindrer bruk av kjente 
          kompromitterte passord.
        </AlertDescription>
      </Alert>
    </div>
  );
};