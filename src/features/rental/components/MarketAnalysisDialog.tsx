import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/shared/hooks/use-toast";
import { supabase } from "@/shared/integrations/supabase/client";
import { TrendingUp, MapPin, DollarSign, BarChart3, Loader2 } from "lucide-react";

interface Property {
  id: string;
  address: string;
  city?: string;
  postal_code?: string;
  property_type?: string;
  size_sqm?: number;
  bedrooms?: number;
  monthly_rent?: number;
}

interface MarketAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: Property[];
}

interface MarketData {
  averageRent: number;
  medianRent: number;
  rentRange: {
    min: number;
    max: number;
  };
  marketTrend: string;
  dataSource: string;
  lastUpdated: string;
  municipality: string;
  propertyType: string;
}

const MarketAnalysisDialog = ({ open, onOpenChange, properties }: MarketAnalysisDialogProps) => {
  const { toast } = useToast();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [customAddress, setCustomAddress] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [customPostalCode, setCustomPostalCode] = useState('');
  const [customPropertyType, setCustomPropertyType] = useState('');
  const [customSize, setCustomSize] = useState('');
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [marketData, setMarketData] = useState<MarketData | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setMarketData(null);

    try {
      let analysisData;
      
      if (useCustomAddress) {
        if (!customAddress || !customCity || !customPostalCode || !customSize) {
          toast({
            title: "Manglende informasjon",
            description: "Vennligst fyll ut alle påkrevde felter (adresse, postnummer, by og størrelse)",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        analysisData = {
          address: customAddress,
          city: customCity,
          postal_code: customPostalCode,
          property_type: customPropertyType || 'Leilighet',
          size_sqm: parseInt(customSize),
        };
      } else {
        if (!selectedPropertyId) {
          toast({
            title: "Ingen eiendom valgt",
            description: "Vennligst velg en eiendom for analyse",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const selectedProperty = properties.find(p => p.id === selectedPropertyId);
        if (!selectedProperty) {
          toast({
            title: "Feil",
            description: "Kunne ikke finne valgt eiendom",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        analysisData = {
          address: selectedProperty.address,
          city: selectedProperty.city,
          postal_code: selectedProperty.postal_code,
          property_type: selectedProperty.property_type || 'Leilighet',
          size_sqm: selectedProperty.size_sqm,
          current_rent: selectedProperty.monthly_rent,
        };
      }

      console.log('Sending analysis request:', analysisData);

      const { data, error } = await supabase.functions.invoke('market-analysis', {
        body: analysisData
      });

      if (error) {
        console.error('Error calling market analysis function:', error);
        throw error;
      }

      if (data?.error) {
        console.error('Market analysis function returned error:', data.error);
        throw new Error(data.error);
      }

      if (data?.marketData) {
        setMarketData(data.marketData);
        
        // Show appropriate toast based on actual data source
        const isMarketAnalysisData = data.marketData.dataSource.includes('norske leiemarkedsdata');
        toast({
          title: "Analyse fullført",
          description: isMarketAnalysisData 
            ? "Markedsdata basert på oppdaterte norske leiemarkedsdata (2024)" 
            : "Markedsanalyse basert på beregnet estimat",
        });
      } else {
        throw new Error('Ingen markedsdata mottatt');
      }

    } catch (error) {
      console.error('Error during market analysis:', error);
      toast({
        title: "Feil ved markedsanalyse",
        description: error instanceof Error ? error.message : "Kunne ikke hente markedsdata",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetDialog = () => {
    setSelectedPropertyId('');
    setCustomAddress('');
    setCustomCity('');
    setCustomPostalCode('');
    setCustomPropertyType('');
    setCustomSize('');
    setUseCustomAddress(false);
    setMarketData(null);
    setLoading(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetDialog();
    }
    onOpenChange(newOpen);
  };

  const userProperties = properties.filter(p => p.id !== 'example' && p.id !== 'demo1' && p.id !== 'demo2' && p.id !== 'demo3');

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Markedsanalyse
          </DialogTitle>
          <DialogDescription>
            Analyserer leiemarkedet for å gi deg innsikt i prisforventninger og markedstrender for utleieeiendommer.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Velg eiendom for analyse</CardTitle>
                <CardDescription>
                  Velg mellom dine eiendommer eller legg inn en spesifikk adresse
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Toggle between property selection and custom address */}
                <div className="flex gap-2">
                  <Button
                    variant={!useCustomAddress ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseCustomAddress(false)}
                    disabled={userProperties.length === 0}
                  >
                    Mine eiendommer
                  </Button>
                  <Button
                    variant={useCustomAddress ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseCustomAddress(true)}
                  >
                    Spesifikk adresse
                  </Button>
                </div>

                {!useCustomAddress ? (
                  /* Property Selection */
                  userProperties.length > 0 ? (
                    <div className="space-y-2">
                      <Label htmlFor="property-select">Velg eiendom</Label>
                      <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Velg en av dine eiendommer" />
                        </SelectTrigger>
                        <SelectContent>
                          {userProperties.map((property) => (
                            <SelectItem key={property.id} value={property.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{property.address}</span>
                                <Badge variant="outline" className="ml-2">
                                  {property.city}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedPropertyId && (
                        <div className="p-3 bg-muted rounded-lg">
                          {(() => {
                            const selected = userProperties.find(p => p.id === selectedPropertyId);
                            return selected ? (
                              <div className="space-y-1 text-sm">
                                <p><strong>Adresse:</strong> {selected.address}, {selected.postal_code} {selected.city}</p>
                                <p><strong>Type:</strong> {selected.property_type}</p>
                                <p><strong>Størrelse:</strong> {selected.size_sqm}m²</p>
                                {selected.monthly_rent && (
                                  <p><strong>Nåværende leie:</strong> {selected.monthly_rent.toLocaleString()} kr/mnd</p>
                                )}
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>Du har ingen eiendommer ennå.</p>
                      <p>Bruk "Spesifikk adresse" for å analysere en adresse.</p>
                    </div>
                  )
                ) : (
                  /* Custom Address Input */
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="custom-address">Adresse *</Label>
                      <Input
                        id="custom-address"
                        value={customAddress}
                        onChange={(e) => setCustomAddress(e.target.value)}
                        placeholder="f.eks. Storgata 1"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="custom-postal">Postnummer *</Label>
                        <Input
                          id="custom-postal"
                          value={customPostalCode}
                          onChange={(e) => setCustomPostalCode(e.target.value)}
                          placeholder="0001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="custom-city">By *</Label>
                        <Input
                          id="custom-city"
                          value={customCity}
                          onChange={(e) => setCustomCity(e.target.value)}
                          placeholder="Oslo"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="custom-type">Boligtype</Label>
                        <Select value={customPropertyType} onValueChange={setCustomPropertyType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Velg type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Leilighet">Leilighet</SelectItem>
                            <SelectItem value="Enebolig">Enebolig</SelectItem>
                            <SelectItem value="Rekkehus">Rekkehus</SelectItem>
                            <SelectItem value="Tomannsbolig">Tomannsbolig</SelectItem>
                            <SelectItem value="Hybel">Hybel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="custom-size">Størrelse (m²) *</Label>
                        <Input
                          id="custom-size"
                          value={customSize}
                          onChange={(e) => setCustomSize(e.target.value)}
                          placeholder="70"
                          type="number"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleAnalyze} 
                  disabled={loading || (!useCustomAddress && !selectedPropertyId) || (useCustomAddress && (!customAddress || !customCity || !customPostalCode || !customSize))}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyserer...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Start markedsanalyse
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {marketData ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Markedsanalyse resultat
                  </CardTitle>
                  <CardDescription>
                    Basert på data fra {marketData.dataSource}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                      <DollarSign className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Gjennomsnittlig leie</p>
                      <p className="text-2xl font-bold text-primary">
                        {marketData.averageRent.toLocaleString()} kr
                      </p>
                    </div>
                    
                    <div className="text-center p-4 bg-accent/10 rounded-lg">
                      <TrendingUp className="h-6 w-6 mx-auto mb-2 text-accent" />
                      <p className="text-sm text-muted-foreground">Median leie</p>
                      <p className="text-2xl font-bold text-accent">
                        {marketData.medianRent.toLocaleString()} kr
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Leieområde:</span>
                      <span className="font-semibold">
                        {marketData.rentRange.min.toLocaleString()} - {marketData.rentRange.max.toLocaleString()} kr
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Markedstrend:</span>
                      <Badge variant={marketData.marketTrend === 'stigende' ? 'default' : marketData.marketTrend === 'fallende' ? 'destructive' : 'secondary'}>
                        {marketData.marketTrend}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Kommune:</span>
                      <span className="font-semibold">{marketData.municipality}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Boligtype:</span>
                      <span className="font-semibold">{marketData.propertyType}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="text-xs text-muted-foreground">
                    <p>Sist oppdatert: {new Date(marketData.lastUpdated).toLocaleDateString('no-NO')}</p>
                    <p>Datakilde: {marketData.dataSource}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ingen analyse utført</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    Velg en eiendom eller legg inn en adresse for å starte markedsanalysen
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MarketAnalysisDialog;