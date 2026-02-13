import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/shared/integrations/supabase/client';
import { MapPin, Loader2, TrendingUp } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';

interface PropertyValueFetcherProps {
  onValueReceived?: (value: number) => void;
  initialAddress?: string;
  className?: string;
}

const PropertyValueFetcher: React.FC<PropertyValueFetcherProps> = ({
  onValueReceived,
  initialAddress = '',
  className
}) => {
  const [address, setAddress] = useState(initialAddress);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const { toast } = useToast();

  const handleGetValue = async () => {
    if (!address.trim()) {
      toast({
        title: "Manglende adresse",
        description: "Vennligst fyll inn en adresse",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('property-valuation', {
        body: {
          address: address.trim()
        }
      });

      if (error) throw error;

      setResult(data);

      if (data.estimatedValue) {
        if (onValueReceived) {
          onValueReceived(data.estimatedValue);
        }
        toast({
          title: "Eiendomsverdi hentet!",
          description: `Estimert verdi: ${data.estimatedValue.toLocaleString()} kr`,
        });
      } else {
        toast({
          title: "Kunne ikke hente verdi",
          description: data.error || "Ingen verdi funnet for denne adressen",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error getting property value:', error);
      toast({
        title: "Feil ved henting",
        description: "Vennligst prøv igjen senere",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="w-4 h-4" />
          Hent Eiendomsverdi
        </CardTitle>
        <CardDescription className="text-sm">
          Automatisk verdiestimering basert på offentlige data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label htmlFor="address-input" className="text-sm">Adresse</Label>
          <Input
            id="address-input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="f.eks. Karl Johans gate 1, Oslo"
            disabled={loading}
            className="text-sm"
          />
        </div>

        <Button 
          onClick={handleGetValue} 
          disabled={loading || !address.trim()}
          size="sm"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              Henter...
            </>
          ) : (
            <>
              <TrendingUp className="w-3 h-3 mr-2" />
              Hent Verdi
            </>
          )}
        </Button>

        {result && result.estimatedValue && (
          <div className="bg-primary/5 rounded-lg p-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Estimert verdi</p>
              <p className="text-lg font-bold text-primary">
                {result.estimatedValue.toLocaleString()} kr
              </p>
              <div className="flex justify-center mt-1">
                <Badge variant="outline" className="text-xs">
                  {result.source === 'kartverket' ? 'Kartverket data' : 'Estimat'}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyValueFetcher;