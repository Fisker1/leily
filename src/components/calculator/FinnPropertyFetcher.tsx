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
import { FinnPropertyDisplay } from './FinnPropertyDisplay';

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
  const [finnInput, setFinnInput] = useState(initialFinnCode);
  const [loading, setLoading] = useState(false);
  const [propertyData, setPropertyData] = useState<FinnPropertyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  
  const { toast } = useToast();
  const { isPro } = useSubscription();

  const extractFinnCodeFromUrl = (input: string): string | null => {
    // If it's already just a Finn code (8-9 digits), return it
    if (/^\d{8,9}$/.test(input.trim())) {
      return input.trim();
    }
    
    // Extract from URL
    const urlPattern = /finnkode=(\d{8,9})/;
    const match = input.match(urlPattern);
    return match ? match[1] : null;
  };

  const validateFinnInput = (input: string): { isValid: boolean; finnCode: string | null } => {
    const extractedCode = extractFinnCodeFromUrl(input);
    return {
      isValid: extractedCode !== null && utilValidateFinnCode(extractedCode),
      finnCode: extractedCode
    };
  };

  const handleFetchProperty = async () => {
    console.log('🚀🚀🚀 STARTING FINN PROPERTY FETCH 🚀🚀🚀');
    console.log('Input finn input:', finnInput);
    console.log('User isPro:', isPro);
    
    if (!finnInput.trim()) {
      console.log('❌ Empty finn input');
      setError('Vennligst fyll inn en Finn.no URL eller Finn-kode');
      return;
    }

    const validation = validateFinnInput(finnInput);
    console.log('Validation result:', validation);
    
    if (!validation.isValid || !validation.finnCode) {
      console.log('❌ Invalid finn input format');
      setError('Ugyldig URL eller Finn-kode format. Koden skal være 8-9 siffer.');
      return;
    }

    const cleanCode = validation.finnCode;
    console.log('Extracted finn code:', cleanCode);

    if (!isPro) {
      console.log('❌ User not Pro');
      toast({
        title: "Pro-abonnement påkrevd",
        description: "Automatisk henting fra Finn.no krever Pro-abonnement",
        variant: "destructive"
      });
      return;
    }

    console.log('✅ All validations passed, proceeding with fetch...');
    setLoading(true);
    setError(null);
    setPropertyData(null);

    try {
      console.log('🔍 About to call edge function with cleanCode:', cleanCode);
      console.log('🔧 Supabase client exists:', !!supabase);
      console.log('📤 Request body will be:', { finnCode: cleanCode });
      
      // Use Supabase edge function for real Finn.no data
      const { data, error: functionError } = await supabase.functions.invoke('finn-property-scraper', {
        body: { finnCode: cleanCode }
      });

      console.log('📊 COMPLETE Edge function response:');
      console.log('  📄 data type:', typeof data);
      console.log('  📄 data value:', data);
      console.log('  ❌ error type:', typeof functionError);
      console.log('  ❌ error value:', functionError);
      console.log('  ❌ error name:', functionError?.name);
      console.log('  ❌ error message:', functionError?.message);
      console.log('  ❌ error context:', functionError?.context);

      // Handle both function errors and error responses
      if (functionError) {
        console.error('❌❌❌ FUNCTION ERROR DETECTED ❌❌❌');
        console.error('Full error object:', JSON.stringify(functionError, null, 2));
        
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
        console.log('🔍 Supabase client failed, attempting manual fetch for error details...');
        
        // Try to fetch the actual error response manually
        try {
          // Get current session and token properly
          const { data: { session } } = await supabase.auth.getSession();
          const authToken = session?.access_token;
          
          console.log('🔐 Auth session available:', !!session);
          console.log('🔐 Auth token available:', !!authToken);
          console.log('🔐 User ID:', session?.user?.id);
          
          if (!authToken) {
            console.log('❌ No auth token available, user might not be logged in');
            errorMessage = 'Du må være innlogget for å bruke denne funksjonen.';
          } else {
            const response = await fetch(`https://rkhzyzuttsvsjcgzrokt.supabase.co/functions/v1/finn-property-scraper`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJraHp5enV0dHN2c2pjZ3pyb2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MjM5NDMsImV4cCI6MjA3MTE5OTk0M30.CU5UT8k9b8AIW_WF2a5dHc3X8sV5ugXF5QmAhVMGwoc',
                'Content-Type': 'application/json',
                'x-client-info': 'supabase-js-web/2.58.0'
              },
              body: JSON.stringify({ finnCode: cleanCode })
            });
            
            console.log('📡 Manual fetch response status:', response.status);
            console.log('📡 Manual fetch response ok:', response.ok);
            console.log('📡 Manual fetch response headers:', Object.fromEntries(response.headers.entries()));
            
            const responseText = await response.text();
            console.log('📄 Raw response text:', responseText);
            
            let errorData;
            try {
              errorData = JSON.parse(responseText);
              console.log('📄 Parsed response data:', errorData);
            } catch (parseError) {
              console.error('❌ Failed to parse response as JSON:', parseError);
              console.log('📄 Response was not valid JSON:', responseText.substring(0, 500));
              errorMessage = 'Tjenesten er midlertidig utilgjengelig. Prøv igjen senere.';
              return;
            }
            
            if (errorData.success === false && errorData.message) {
              console.log('✅ Found actual error message from edge function:', errorData.message);
              errorMessage = errorData.message;
            } else if (errorData.error === 'quota_exceeded') {
              console.log('🚫 Quota exceeded detected from manual fetch');
              errorMessage = 'OpenAI API kvote overskredet. Tjenesten er midlertidig utilgjengelig. Prøv igjen senere.';
            } else if (errorData.error === 'property_not_found') {
              console.log('🏠 Property not found detected from manual fetch');  
              errorMessage = 'Fant ikke eiendommen. Sjekk Finn-koden og prøv igjen.';
            } else if (response.status === 403) {
              console.log('🔐 Authentication failed - invalid JWT');
              errorMessage = 'Sesjonen din har utløpt. Vennligst logg inn på nytt.';
            } else if (response.status === 429) {
              console.log('🚫 Rate limit or quota exceeded (429)');
              errorMessage = 'OpenAI API kvote overskredet. Tjenesten er midlertidig utilgjengelig. Prøv igjen senere.';
            } else if (response.status === 404) {
              console.log('🏠 Property not found (404)');
              errorMessage = 'Fant ikke eiendommen. Sjekk Finn-koden og prøv igjen.';
            } else {
              console.log('⚠️ Unknown error response:', { status: response.status, data: errorData });
              errorMessage = errorData.message || `HTTP ${response.status} feil fra tjenesten.`;
            }
          }
        } catch (fetchError) {
          console.error('❌ Manual fetch also failed:', fetchError);
          console.log('🤷 Using fallback error message');
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
          Hent eiendomsdata automatisk med Finn.no URL eller Finn-kode fra annonsen. Data lagres i 6 måneder for raskere tilgang.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!propertyData && (
          <>
            <div>
              <Label htmlFor="finn-input" className="text-sm">Finn.no URL eller Finn-kode</Label>
              <Input
                id="finn-input"
                value={finnInput}
                onChange={(e) => setFinnInput(e.target.value)}
                placeholder="https://www.finn.no/realestate/homes/ad.html?finnkode=123456789 eller bare 123456789"
                disabled={loading || disabled}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Kopier hele URL-en fra Finn.no eller skriv bare Finn-koden (8-9 siffer)
              </p>
            </div>

            <Button 
              onClick={handleFetchProperty} 
              disabled={loading || disabled || !finnInput.trim()}
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
          <FinnPropertyDisplay
            propertyData={propertyData}
            cached={cached}
            onClearData={handleClearData}
            onViewOnFinn={() => window.open(`https://www.finn.no/realestate/homes/ad.html?finnkode=${propertyData.finnCode}`, '_blank')}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default FinnPropertyFetcher;