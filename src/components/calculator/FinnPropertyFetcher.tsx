import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, Loader2, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { FinnPropertyData, FinnPropertyResponse } from '@/types/finn';
import { formatNumberWithSpaces } from '@/lib/utils';
import { validateFinnCode as utilValidateFinnCode } from '@/utils/finnScraper';

interface FinnPropertyFetcherProps {
  onPropertyDataReceived?: (data: FinnPropertyData) => void;
  initialFinnCode?: string;
  className?: string;
  disabled?: boolean;
}

const FinnPropertyFetcher: React.FC<FinnPropertyFetcherProps> = ({
  onPropertyDataReceived,
  initialFinnCode = '',
  className,
  disabled = false
}) => {
  const [finnCode, setFinnCode] = useState(initialFinnCode);
  const [loading, setLoading] = useState(false);
  const [propertyData, setPropertyData] = useState<FinnPropertyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  
  const { toast } = useToast();
  const { isPro } = useSubscription();

  const validateFinnCode = (code: string): boolean => {
    return utilValidateFinnCode(code);
  };

  const handleFetchProperty = async () => {
    if (!finnCode.trim()) {
      setError('Vennligst fyll inn en Finn-kode');
      return;
    }

    const cleanCode = finnCode.trim();
    if (!validateFinnCode(cleanCode)) {
      setError('Ugyldig Finn-kode format. Koden skal være 8-9 siffer.');
      return;
    }

    if (!isPro) {
      toast({
        title: "Pro-abonnement påkrevd",
        description: "Automatisk henting fra Finn.no krever Pro-abonnement",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError(null);
    setPropertyData(null);

    try {
      console.log('🔍 Fetching Finn property data for code:', cleanCode);
      
      // Use Supabase edge function for real Finn.no data
      const { data, error: functionError } = await supabase.functions.invoke('finn-property-scraper', {
        body: { finnCode: cleanCode }
      });

      console.log('📊 Edge function response:', { data, functionError });

      // Handle both function errors and error responses
      if (functionError) {
        console.error('❌ Function error:', functionError);
        
        // Try to extract error details from the error object
        let errorMessage = 'Kunne ikke hente eiendomsdata';
        
        // Check if the error has details about the response
        if (functionError.message) {
          if (functionError.message.includes('quota exceeded') || functionError.message.includes('429')) {
            errorMessage = 'OpenAI API kvote overskredet. Tjenesten er midlertidig utilgjengelig. Prøv igjen senere.';
          } else if (functionError.message.includes('404') || functionError.message.includes('not found')) {
            errorMessage = 'Fant ikke eiendommen. Sjekk Finn-koden og prøv igjen.';
          } else {
            errorMessage = functionError.message;
          }
        }
        
        throw new Error(errorMessage);
      }

      const response = data as FinnPropertyResponse;
      console.log('✅ Parsed response:', response);

      if (!response.success) {
        throw new Error(response.message || 'Kunne ikke hente eiendomsdata');
      }

      if (response.data) {
        setPropertyData(response.data);
        setCached(response.cached || false);
        
        if (onPropertyDataReceived) {
          onPropertyDataReceived(response.data);
        }

        toast({
          title: "Eiendomsdata hentet!",
          description: response.cached 
            ? "Data hentet fra hurtiglager (cache)" 
            : "Ferske data hentet fra Finn.no",
        });
        toast({
          title: "Eiendomsdata hentet!",
          description: response.cached 
            ? "Data hentet fra hurtiglager (cache)" 
            : "Ferske data hentet fra Finn.no",
        });
      }

    } catch (error: any) {
      console.error('❌ Error fetching Finn property:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        context: error.context
      });
      
      // Handle different error types from the edge function
      let errorMessage = 'Kunne ikke hente eiendomsdata';
      
      // Try to handle Supabase FunctionsHttpError specifically
      if (error.name === 'FunctionsHttpError' || error.message?.includes('non-2xx status code')) {
        console.log('🔍 Attempting to fetch error details manually...');
        
        // Try to fetch the actual error response manually
        try {
          const response = await fetch(`https://rkhzyzuttsvsjcgzrokt.supabase.co/functions/v1/finn-property-scraper`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${(supabase as any).supabaseKey}`,
              'apikey': (supabase as any).supabaseKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ finnCode: cleanCode })
          });
          
          const errorData = await response.json();
          console.log('📝 Manual fetch response:', errorData);
          
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error === 'quota_exceeded') {
            errorMessage = 'OpenAI API kvote overskredet. Tjenesten er midlertidig utilgjengelig. Prøv igjen senere.';
          }
        } catch (fetchError) {
          console.error('❌ Manual fetch also failed:', fetchError);
        }
      } else if (error.message) {
        if (error.message.includes('OpenAI API quota exceeded') || error.message.includes('quota exceeded')) {
          errorMessage = 'OpenAI API kvote overskredet. Tjenesten er midlertidig utilgjengelig. Prøv igjen senere.';
        } else if (error.message.includes('Property not found')) {
          errorMessage = 'Fant ikke eiendommen. Sjekk Finn-koden og prøv igjen.';
        } else if (error.message.includes('Service configuration error')) {
          errorMessage = 'Tjenestekonfigurasjonsfeil. Kontakt support.';
        } else {
          errorMessage = error.message;
        }
      }
      
      console.log('🎯 Final error message:', errorMessage);
      setError(errorMessage);
      
      toast({
        title: "Feil ved henting",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = () => {
    setPropertyData(null);
    setError(null);
    setCached(false);
  };

  if (!isPro) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ExternalLink className="w-4 h-4" />
            Automatisk henting fra Finn.no
          </CardTitle>
          <CardDescription className="text-sm">
            Hent eiendomsdata automatisk med Finn-kode
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Automatisk henting fra Finn.no er kun tilgjengelig for Pro-brukere. 
              <br />
              <strong>Gratisbrukere kan fylle ut kalkulatoren manuelt.</strong>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ExternalLink className="w-4 h-4" />
          Automatisk henting fra Finn.no
          <Badge variant="secondary" className="text-xs">Pro</Badge>
        </CardTitle>
        <CardDescription className="text-sm">
          Hent eiendomsdata automatisk med Finn-kode fra annonsen. Data lagres i 6 måneder for raskere tilgang.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!propertyData && (
          <>
            <div>
              <Label htmlFor="finn-code-input" className="text-sm">Finn-kode</Label>
              <Input
                id="finn-code-input"
                value={finnCode}
                onChange={(e) => setFinnCode(e.target.value)}
                placeholder="f.eks. 123456789"
                disabled={loading || disabled}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Finner du i URL-en på Finn.no annonsen, f.eks. finn.no/realestate/homes/ad/<strong>123456789</strong>
              </p>
            </div>

            <Button 
              onClick={handleFetchProperty} 
              disabled={loading || disabled || !finnCode.trim()}
              size="sm"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Henter data...
                </>
              ) : (
                <>
                  <Download className="w-3 h-3 mr-2" />
                  Hent eiendomsdata
                </>
              )}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </>
        )}

        {propertyData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Data hentet</span>
                {cached && (
                  <Badge variant="outline" className="text-xs">
                    Fra cache
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearData}
                className="text-xs"
              >
                Fjern data
              </Button>
            </div>

            <div className="bg-primary/5 rounded-lg p-4 space-y-3">
              <div>
                <h4 className="font-medium text-sm">{propertyData.title}</h4>
                <p className="text-xs text-muted-foreground">{propertyData.address}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Pris</p>
                  <p className="font-semibold">{formatNumberWithSpaces(propertyData.price)} kr</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-semibold capitalize">{propertyData.propertyType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Areal</p>
                  <p className="font-semibold">{propertyData.livingArea} m²</p>
                </div>
                {propertyData.bedrooms && (
                  <div>
                    <p className="text-xs text-muted-foreground">Soverom</p>
                    <p className="font-semibold">{propertyData.bedrooms}</p>
                  </div>
                )}
                {propertyData.monthlyRent && (
                  <div>
                    <p className="text-xs text-muted-foreground">Månedlig leie</p>
                    <p className="font-semibold">{formatNumberWithSpaces(propertyData.monthlyRent)} kr/mnd</p>
                  </div>
                )}
                {propertyData.municipalFees && (
                  <div>
                    <p className="text-xs text-muted-foreground">Kommunale avgifter</p>
                    <p className="font-semibold">{formatNumberWithSpaces(propertyData.municipalFees)} kr/mnd</p>
                  </div>
                )}
                {propertyData.sharedCosts && (
                  <div>
                    <p className="text-xs text-muted-foreground">Fellesutgifter</p>
                    <p className="font-semibold">{formatNumberWithSpaces(propertyData.sharedCosts)} kr/mnd</p>
                  </div>
                )}
                {propertyData.pricePerSqm && (
                  <div>
                    <p className="text-xs text-muted-foreground">Pris per m²</p>
                    <p className="font-semibold">{formatNumberWithSpaces(propertyData.pricePerSqm)} kr/m²</p>
                  </div>
                )}
                {propertyData.yearBuilt && (
                  <div>
                    <p className="text-xs text-muted-foreground">Byggeår</p>
                    <p className="font-semibold">{propertyData.yearBuilt}</p>
                  </div>
                )}
                {propertyData.energyRating && (
                  <div>
                    <p className="text-xs text-muted-foreground">Energimerking</p>
                    <p className="font-semibold">{propertyData.energyRating}</p>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-primary/10">
                <p className="text-xs text-muted-foreground">
                  Data automatisk hentet fra Finn.no og lagret i 6 måneder. Du kan fortsatt redigere verdiene manuelt nedenfor.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://www.finn.no/realestate/homes/ad/${propertyData.finnCode}`, '_blank')}
              className="w-full text-xs"
            >
              <ExternalLink className="w-3 h-3 mr-2" />
              Vis på Finn.no
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FinnPropertyFetcher;