import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Plus, TrendingUp, MapPin, Zap, Hand } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import PropertyValuationAPI from '@/components/PropertyValuationAPI';
import { useSubscription } from '@/hooks/useSubscription';
import PropertyLeaseHistory from './PropertyLeaseHistory';

interface Property {
  id: string;
  address: string;
  city?: string;
  postal_code?: string;
  property_type?: string;
  size_sqm?: number;
  bedrooms?: number;
  purchase_price?: number;
  purchase_date?: string;
  loan_amount?: number;
  interest_rate?: number;
  loan_duration_years?: number;
  current_value?: number;
  image_url?: string;
}

interface PropertyValuation {
  id: string;
  valuation_amount: number;
  valuation_date: string;
  valuation_type: string;
  source?: string;
  notes?: string;
}

interface PropertyDetailsDialogProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PropertyDetailsDialog = ({ property, open, onOpenChange }: PropertyDetailsDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [valuations, setValuations] = useState<PropertyValuation[]>([]);
  const [showAddValuation, setShowAddValuation] = useState(false);
  const { toast } = useToast();
  const { isPro, isFree } = useSubscription();
  
  const [newValuation, setNewValuation] = useState({
    amount: "",
    date: new Date().toISOString().split('T')[0],
    source: "",
    notes: ""
  });

  useEffect(() => {
    if (open) {
      fetchValuations();
    }
  }, [open, property.id]);

  const fetchValuations = async () => {
    try {
      const { data, error } = await supabase
        .from('property_valuations')
        .select('*')
        .eq('property_id', property.id)
        .order('valuation_date', { ascending: true });

      if (error) throw error;
      setValuations(data || []);
    } catch (error) {
      console.error('Error fetching valuations:', error);
    }
  };

  const handleAddValuation = async () => {
    if (!newValuation.amount || !newValuation.date) {
      toast({
        title: "Feil",
        description: "Verdi og dato er påkrevd",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('property_valuations')
        .insert([{
          property_id: property.id,
          valuation_amount: parseFloat(newValuation.amount),
          valuation_date: newValuation.date,
          valuation_type: 'manual',
          source: newValuation.source || null,
          notes: newValuation.notes || null
        }]);

      if (error) throw error;

      toast({
        title: "Suksess",
        description: "Verdivurdering lagt til",
      });

      setNewValuation({
        amount: "",
        date: new Date().toISOString().split('T')[0],
        source: "",
        notes: ""
      });
      setShowAddValuation(false);
      fetchValuations();
    } catch (error) {
      console.error('Error adding valuation:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke legge til verdivurdering",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValuationFromAPI = async (valuation: { estimatedValue: number; confidence?: number; source?: string }) => {
    if (valuation.estimatedValue) {
      try {
        const { error } = await supabase
          .from('property_valuations')
          .insert([{
            property_id: property.id,
            valuation_amount: valuation.estimatedValue,
            valuation_date: new Date().toISOString().split('T')[0],
            valuation_type: 'api',
            source: valuation.source === 'kartverket' ? 'Kartverket API' : 'Estimat API',
            notes: `Automatisk hentet verdi. Konfidens: ${valuation.confidence}`
          }]);

        if (error) throw error;

        toast({
          title: "Verdivurdering lagret",
          description: `Eiendomsverdi på ${valuation.estimatedValue.toLocaleString()} kr er lagt til`,
        });

        fetchValuations();
      } catch (error) {
        console.error('Error saving API valuation:', error);
        toast({
          title: "Feil",
          description: "Kunne ikke lagre automatisk verdivurdering",
          variant: "destructive",
        });
      }
    }
  };

  const chartData = valuations.map(v => ({
    date: new Date(v.valuation_date).toLocaleDateString('no-NO'),
    value: v.valuation_amount,
    fullDate: v.valuation_date
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Eiendomsdetaljer - {property.address}
          </DialogTitle>
          <DialogDescription>
            Eiendomsinformasjon, prisutviklings-graf og automatisk verdivurdering
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Eiendomsinfo</TabsTrigger>
            <TabsTrigger value="leases">Leiehistorikk</TabsTrigger>
            <TabsTrigger value="valuation" className="flex items-center gap-2">
              {isFree ? <Hand className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              Verdivurdering
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              {isPro ? <Zap className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
              {isPro ? "Auto Verdi" : "Hent Verdi"}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-6">
            {/* Eiendomsinformasjon */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Eiendomsinformasjon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Adresse</p>
                    <p className="font-medium">{property.address}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">By</p>
                    <p className="font-medium">{property.city || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium">{property.property_type || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Størrelse</p>
                    <p className="font-medium">{property.size_sqm ? `${property.size_sqm} m²` : '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Kjøpspris</p>
                    <p className="font-medium">{property.purchase_price ? `${property.purchase_price.toLocaleString()} kr` : '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Kjøpsdato</p>
                    <p className="font-medium">{property.purchase_date ? new Date(property.purchase_date).toLocaleDateString('no-NO') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Lån</p>
                    <p className="font-medium">{property.loan_amount ? `${property.loan_amount.toLocaleString()} kr` : '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rente</p>
                    <p className="font-medium">{property.interest_rate ? `${property.interest_rate}%` : '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leases" className="space-y-6">
            <PropertyLeaseHistory 
              propertyId={property.id} 
              propertyAddress={property.address}
            />
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <PropertyValuationAPI
              propertyId={property.id}
              initialAddress={property.address}
              initialPostalCode={property.postal_code}
              initialCity={property.city}
              onValuationReceived={handleValuationFromAPI}
            />
          </TabsContent>

          <TabsContent value="valuation" className="space-y-6">
            {/* Prisutviklings-graf */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {isFree ? <Hand className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                      {isFree ? "Manuell prisutvikling" : "Prisutvikling over tid"}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {isFree ? "Legg inn verdier manuelt" : "Automatisk og manuell verdivurdering"}
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowAddValuation(!showAddValuation)} size="sm" className="self-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Legg til verdivurdering
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showAddValuation && (
                  <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-4">Ny verdivurdering</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="valuation_amount">Verdi (kr) *</Label>
                        <Input
                          id="valuation_amount"
                          type="number"
                          value={newValuation.amount}
                          onChange={(e) => setNewValuation(prev => ({ ...prev, amount: e.target.value }))}
                          placeholder="3500000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="valuation_date">Dato *</Label>
                        <Input
                          id="valuation_date"
                          type="date"
                          value={newValuation.date}
                          onChange={(e) => setNewValuation(prev => ({ ...prev, date: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="valuation_source">Kilde</Label>
                        <Input
                          id="valuation_source"
                          value={newValuation.source}
                          onChange={(e) => setNewValuation(prev => ({ ...prev, source: e.target.value }))}
                          placeholder="f.eks. Finn.no, eiendomsmegler"
                        />
                      </div>
                      <div>
                        <Label htmlFor="valuation_notes">Notater</Label>
                        <Input
                          id="valuation_notes"
                          value={newValuation.notes}
                          onChange={(e) => setNewValuation(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Tilleggsinformasjon"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={handleAddValuation} disabled={loading}>
                        {loading ? "Lagrer..." : "Legg til"}
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddValuation(false)}>
                        Avbryt
                      </Button>
                    </div>
                  </div>
                )}

                {chartData.length > 0 ? (
                  <ChartContainer
                    config={{
                      value: {
                        label: "Verdi",
                        color: "hsl(var(--primary))",
                      },
                    }}
                    className="h-64"
                  >
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis 
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M kr`}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="var(--color-value)" 
                        strokeWidth={2}
                        dot={{ fill: "var(--color-value)", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Ingen verdivurderinger registrert ennå</p>
                    <p className="text-sm">Legg til din første verdivurdering for å se prisutvikling</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Verdivurderinger liste */}
            {valuations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Verdivurderinger</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {valuations.map((valuation) => (
                      <div key={valuation.id} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                        <div className="flex-1">
                          <p className="font-medium">{valuation.valuation_amount.toLocaleString()} kr</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(valuation.valuation_date).toLocaleDateString('no-NO')}
                            {valuation.source && ` • ${valuation.source}`}
                          </p>
                          {valuation.notes && (
                            <p className="text-sm text-muted-foreground">{valuation.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            Lukk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};