import React, { useState, useEffect } from 'react';
import { format, addYears } from 'date-fns';
import { nb } from 'date-fns/locale';
import { Calculator, TrendingUp, Calendar, Building } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface IndexRegulationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaseId?: string;
  propertyId?: string;
}

interface LeaseData {
  id: string;
  property_id: string;
  monthly_rent: number;
  start_date: string;
  property_address: string;
  property_city: string;
}

export const IndexRegulationDialog: React.FC<IndexRegulationDialogProps> = ({
  open,
  onOpenChange,
  leaseId,
  propertyId
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { createEvent } = useCalendarEvents();
  
  const [leaseData, setLeaseData] = useState<LeaseData | null>(null);
  const [currentRent, setCurrentRent] = useState<number>(0);
  const [newRent, setNewRent] = useState<number>(0);
  const [regulationDate, setRegulationDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Mock consumer price index data (in a real app, this would come from an API)
  const consumerPriceIndex = {
    current: 125.3, // Current CPI
    previous: 120.1, // Previous year CPI
    change: 4.3 // Percentage change
  };

  useEffect(() => {
    if (open && (leaseId || propertyId)) {
      fetchLeaseData();
    }
  }, [open, leaseId, propertyId]);

  const fetchLeaseData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('lease_agreements')
        .select(`
          id,
          property_id,
          monthly_rent,
          start_date,
          property:properties(id, address, city)
        `)
        .eq('property_owner_id', user.id)
        .eq('status', 'active');

      if (leaseId) {
        query = query.eq('id', leaseId);
      } else if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error } = await query.single();

      if (error) {
        console.error('Error fetching lease data:', error);
        toast({
          title: "Feil",
          description: "Kunne ikke hente leieavtale-data",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        setLeaseData({
          id: data.id,
          property_id: data.property_id,
          monthly_rent: data.monthly_rent,
          start_date: data.start_date,
          property_address: data.property?.address || '',
          property_city: data.property?.city || ''
        });
        setCurrentRent(data.monthly_rent);
        
        // Calculate new rent based on CPI
        const calculatedNewRent = Math.round(data.monthly_rent * (1 + consumerPriceIndex.change / 100));
        setNewRent(calculatedNewRent);
        
        // Set regulation date to next year from lease start
        const nextRegulationDate = addYears(new Date(data.start_date), 1);
        setRegulationDate(format(nextRegulationDate, 'yyyy-MM-dd'));
      }
    } catch (error) {
      console.error('Error fetching lease data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRegulation = async () => {
    if (!leaseData || !regulationDate) return;

    setSaving(true);
    try {
      // Create calendar event for index regulation
      await createEvent({
        event_type: 'index_regulation',
        title: `Indeksregulering ${new Date(regulationDate).getFullYear()} - ${leaseData.property_address}`,
        description: `Husleie økes fra ${currentRent.toLocaleString('no-NO')} kr til ${newRent.toLocaleString('no-NO')} kr (${consumerPriceIndex.change}% økning basert på konsumprisindeks)`,
        event_date: regulationDate,
        property_id: leaseData.property_id,
        lease_id: leaseData.id,
        is_recurring: true,
        recurring_pattern: 'yearly',
        reminder_days: [30, 14, 7, 3]
      });

      // Update lease with new rent (this would typically be done through a separate process)
      // For now, we'll just create the calendar event

      toast({
        title: "Suksess",
        description: "Indeksregulering planlagt og lagt til kalenderen"
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving index regulation:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke lagre indeksregulering",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const rentIncrease = newRent - currentRent;
  const rentIncreasePercentage = currentRent > 0 ? ((rentIncrease / currentRent) * 100) : 0;

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Indeksregulering</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Laster leieavtale-data...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!leaseData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Indeksregulering</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="text-muted-foreground">Ingen aktiv leieavtale funnet</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Indeksregulering
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Property Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building className="h-4 w-4" />
                Eiendomsinformasjon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Adresse:</span>
                  <span className="font-medium">{leaseData.property_address}, {leaseData.property_city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Leieavtale startet:</span>
                  <span className="font-medium">
                    {format(new Date(leaseData.start_date), "PPP", { locale: nb })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Rent */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-4 w-4" />
                Nåværende husleie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {currentRent.toLocaleString('no-NO')} kr/måned
              </div>
            </CardContent>
          </Card>

          {/* CPI Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Konsumprisindeks (KPI)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{consumerPriceIndex.current}</div>
                  <div className="text-sm text-muted-foreground">Nåværende KPI</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-muted-foreground">{consumerPriceIndex.previous}</div>
                  <div className="text-sm text-muted-foreground">Forrige år</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">+{consumerPriceIndex.change}%</div>
                  <div className="text-sm text-muted-foreground">Endring</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* New Rent Calculation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Foreslått ny husleie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="newRent" className="text-base">Ny månedlig husleie:</Label>
                <Input
                  id="newRent"
                  type="number"
                  value={newRent}
                  onChange={(e) => setNewRent(Number(e.target.value))}
                  className="w-32"
                />
                <span className="text-muted-foreground">kr</span>
              </div>
              
              <div className="flex items-center gap-4">
                <Label htmlFor="regulationDate" className="text-base">Reguleringsdato:</Label>
                <Input
                  id="regulationDate"
                  type="date"
                  value={regulationDate}
                  onChange={(e) => setRegulationDate(e.target.value)}
                  className="w-40"
                />
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Husleieøkning:</span>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      +{rentIncrease.toLocaleString('no-NO')} kr/måned
                    </div>
                    <div className="text-sm text-muted-foreground">
                      (+{rentIncreasePercentage.toFixed(1)}%)
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Avbryt
            </Button>
            <Button
              onClick={handleSaveRegulation}
              disabled={saving}
            >
              {saving ? 'Lagrer...' : 'Planlegg indeksregulering'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};





