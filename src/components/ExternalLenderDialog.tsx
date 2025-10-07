import { useState, useEffect } from 'react';
import { Wallet, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ExternalLenderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: (data: ExternalLenderSettings) => void;
  hasCredits: boolean;
}

export interface ExternalLenderSettings {
  hasExternalLender: boolean;
  externalLenderName: string;
}

export const ExternalLenderDialog = ({ open, onOpenChange, onApply, hasCredits }: ExternalLenderDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  
  const [hasExternalLender, setHasExternalLender] = useState(false);
  const [externalLenderName, setExternalLenderName] = useState('');

  useEffect(() => {
    if (open && user) {
      loadSavedSettings();
    }
  }, [open, user]);

  const loadSavedSettings = async () => {
    try {
      setLoadingSettings(true);
      const { data, error } = await supabase
        .from('external_lender_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setHasExternalLender(data.has_external_lender || false);
        setExternalLenderName(data.external_lender_name || '');
      }
    } catch (error) {
      console.error('Error loading external lender settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSave = async () => {
    if (!hasCredits) {
      toast.error('Du må ha credits for å lagre innstillinger');
      return;
    }

    if (!user) {
      toast.error('Du må være logget inn');
      return;
    }

    try {
      setLoading(true);

      const settings = {
        user_id: user.id,
        has_external_lender: hasExternalLender,
        external_lender_name: externalLenderName
      };

      const { error } = await supabase
        .from('external_lender_settings')
        .upsert(settings, { onConflict: 'user_id' });

      if (error) throw error;

      toast.success('Privatlån-innstillinger lagret!');
      
      if (onApply) {
        onApply({
          hasExternalLender,
          externalLenderName
        });
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving external lender settings:', error);
      toast.error('Kunne ikke lagre innstillinger');
    } finally {
      setLoading(false);
    }
  };

  if (!hasCredits) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Privatlån Innstillinger
            </DialogTitle>
            <DialogDescription>
              Du må ha aktive credits for å bruke denne funksjonen
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Privatlån-innstillinger er tilgjengelig for brukere med credits. Kjøp credits for å få tilgang.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Lukk
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Privatlån Innstillinger
          </DialogTitle>
          <DialogDescription>
            Konfigurer informasjon om ekstern eller privat lånegiver. Innstillingene lagres og fylles automatisk ut i rapporten.
          </DialogDescription>
        </DialogHeader>

        {loadingSettings ? (
          <div className="py-8 text-center text-muted-foreground">
            Laster innstillinger...
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 p-4 border rounded-lg bg-muted/30">
              <Checkbox
                id="hasExternalLender"
                checked={hasExternalLender}
                onCheckedChange={(checked) => setHasExternalLender(checked as boolean)}
              />
              <div className="flex-1">
                <Label 
                  htmlFor="hasExternalLender" 
                  className="text-base font-medium cursor-pointer"
                >
                  Jeg har en ekstern eller privat lånegiver
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  F.eks. familie, venner eller private investorer
                </p>
              </div>
            </div>

            {hasExternalLender && (
              <div className="space-y-3 pl-4 border-l-2 border-primary/40">
                <div>
                  <Label htmlFor="externalLenderName" className="text-base font-semibold">
                    Navn på lånegiver
                  </Label>
                  <Input
                    id="externalLenderName"
                    value={externalLenderName}
                    onChange={(e) => setExternalLenderName(e.target.value)}
                    placeholder="F.eks. Familie, Venner, Privat investor..."
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Dette navnet vil vises i rapporten
                  </p>
                </div>
              </div>
            )}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Du kan laste opp covenant-dokumenter direkte i rapporten når du redigerer den.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Avbryt
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Lagrer...' : 'Lagre innstillinger'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
