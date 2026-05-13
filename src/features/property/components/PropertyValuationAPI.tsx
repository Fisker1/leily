import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/shared/integrations/supabase/client';
import { MapPin, TrendingUp, Loader2, CheckCircle, Info, Lock } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { useSubscription } from '@/shared/hooks/useSubscription';

interface PropertyValuationAPIProps {
  onValuationReceived?: (valuation: { estimatedValue: number; confidence?: number; source: string; address: string; propertyData?: Record<string, unknown>; error?: string }) => void;
  propertyId?: string;
  initialAddress?: string;
  initialPostalCode?: string;
  initialCity?: string;
}

interface ValuationResult {
  estimatedValue?: number;
  confidence?: 'low' | 'medium' | 'high';
  source: 'kartverket' | 'estimated';
  address: string;
  propertyData?: Record<string, unknown>;
  error?: string;
}

const PropertyValuationAPI: React.FC<PropertyValuationAPIProps> = ({
  onValuationReceived,
  propertyId,
  initialAddress = '',
  initialPostalCode = '',
  initialCity = ''
}) => {
  const [address, setAddress] = useState(initialAddress);
  const [postalCode, setPostalCode] = useState(initialPostalCode);
  const [city, setCity] = useState(initialCity);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValuationResult | null>(null);
  const { toast } = useToast();
  const { isPro, isFree } = useSubscription();

  const handleGetValuation = async () => {
    if (!address.trim()) {
      toast({
        title: "Manglende adresse",
        description: "Vennligst fyll inn en adresse for å få eiendomsverdi",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log('Requesting property valuation...');
      
      const { data, error } = await supabase.functions.invoke('property-valuation', {
        body: {
          address: address.trim(),
          postalCode: postalCode.trim() || undefined,
          city: city.trim() || undefined,
          propertyId: propertyId
        }
      });

      if (error) {
        console.error('Property valuation error:', error);
        throw error;
      }

      console.log('Property valuation result:', data);
      setResult(data);

      if (data.estimatedValue && onValuationReceived) {
        onValuationReceived(data);
      }

      if (data.estimatedValue) {
        toast({
          title: "Eiendomsverdi hentet!",
          description: `Estimert verdi: ${data.estimatedValue.toLocaleString()} kr`,
        });
      } else if (data.error) {
        toast({
          title: "Kunne ikke hente eiendomsverdi",
          description: data.error,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error getting property valuation:', error);
      toast({
        title: "Feil ved henting av eiendomsverdi",
        description: "Vennligst prøv igjen senere",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadge = (confidence?: string) => {
    const variants = {
      'low': { variant: 'outline' as const, text: 'Lav pålitelighet', color: 'text-yellow-600' },
      'medium': { variant: 'secondary' as const, text: 'Middels pålitelighet', color: 'text-blue-600' },
      'high': { variant: 'default' as const, text: 'Høy pålitelighet', color: 'text-green-600' }
    };

    const config = variants[confidence as keyof typeof variants] || variants.low;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.text}
      </Badge>
    );
  };

  const getSourceBadge = (source: string) => {
    return source === 'kartverket' ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Kartverket data
      </Badge>
    ) : (
      <Badge variant="outline" className="text-blue-600">
        <TrendingUp className="w-3 h-3 mr-1" />
        Estimat
      </Badge>
    );
  };

  // Show upgrade notice for free users
  if (isFree) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Automatisk Eiendomsverdi (Pro)
          </CardTitle>
          <CardDescription>
            Få automatiske eiendomsverdier fra offentlige kilder
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Automatisk eiendomsvurdering er kun tilgjengelig for Pro-brukere. 
              Oppgrader for å få tilgang til sanntids-verdiestimat fra Kartverket og andre kilder.
            </AlertDescription>
          </Alert>
          <Button className="w-full mt-4" variant="outline">
            Oppgrader til Pro
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Hent Eiendomsverdi
        </CardTitle>
        <CardDescription>
          Få estimert eiendomsverdi basert på offentlige data fra Kartverket
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="address">Adresse *</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="f.eks. Karl Johans gate 1"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="postalCode">Postnummer</Label>
            <Input
              id="postalCode"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="f.eks. 0154"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="city">By</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="f.eks. Oslo"
              disabled={loading}
            />
          </div>
        </div>

        <Button 
          onClick={handleGetValuation} 
          disabled={loading || !address.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Henter eiendomsverdi...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 mr-2" />
              Hent Eiendomsverdi
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Resultat for: {result.address}</h4>
              <div className="flex gap-2">
                {getSourceBadge(result.source)}
                {getConfidenceBadge(result.confidence)}
              </div>
            </div>

            {result.estimatedValue ? (
              <div className="bg-primary/5 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Estimert eiendomsverdi</p>
                  <p className="text-3xl font-bold text-primary">
                    {result.estimatedValue.toLocaleString()} kr
                  </p>
                </div>
              </div>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {result.error || 'Kunne ikke bestemme eiendomsverdi for denne adressen'}
                </AlertDescription>
              </Alert>
            )}

            {result.propertyData && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Kommune:</strong> {String(result.propertyData.municipality || '')}</p>
                <p><strong>Fylke:</strong> {String(result.propertyData.county || '')}</p>
                {result.propertyData.area && (
                  <p><strong>Areal:</strong> {String(result.propertyData.area)} m²</p>
                )}
                {result.propertyData.propertyType && (
                  <p><strong>Type:</strong> {String(result.propertyData.propertyType)}</p>
                )}
              </div>
            )}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Dette er et estimat basert på offentlige data og markedstrender. 
                For presise verdivurderinger, kontakt en takstmann eller eiendomsmegler.
                {result.source === 'kartverket' && ' Data fra Kartverket gir økt nøyaktighet.'}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyValuationAPI;