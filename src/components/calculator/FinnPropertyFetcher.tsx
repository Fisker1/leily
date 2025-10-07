import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Database, ExternalLink, Loader2, Download, AlertTriangle, CheckCircle2, Info, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCredits } from '@/hooks/useCredits';
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
  const { hasCredits, credits } = useCredits();
  const [finnInput, setFinnInput] = useState(initialFinnCode || '');
  const [loading, setLoading] = useState(false);
  const [propertyData, setPropertyData] = useState<FinnPropertyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [isCached, setIsCached] = useState<boolean | null>(null);
  const [cachedDate, setCachedDate] = useState<string | null>(null);
  
  const { toast } = useToast();

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
    const trimmedInput = input.trim();
    const finnCode = extractFinnCodeFromUrl(trimmedInput);
    
    if (!finnCode) {
      return { isValid: false, finnCode: null };
    }
    
    // Validate Finn code format (8 or 9 digits)
    const isValidFormat = /^\d{8,9}$/.test(finnCode);
    return { isValid: isValidFormat, finnCode: isValidFormat ? finnCode : null };
  };

  // Check if property is cached when Finn code changes
  const checkIfCached = async (finnCode: string) => {
    try {
      const { data, error } = await supabase
        .from('finn_property_cache')
        .select('finn_code, extracted_at')
        .eq('finn_code', finnCode)
        .gte('expires_at', new Date().toISOString())
        .maybeSingle();
      
      if (data && !error) {
        setIsCached(true);
        setCachedDate(new Date(data.extracted_at).toLocaleDateString('no-NO'));
      } else {
        setIsCached(false);
        setCachedDate(null);
      }
    } catch (err) {
      console.error('Error checking cache:', err);
      setIsCached(false);
    }
  };

  const handleFinnInputChange = (value: string) => {
    setFinnInput(value);
    const validation = validateFinnInput(value);
    if (validation.isValid && validation.finnCode) {
      checkIfCached(validation.finnCode);
    } else {
      setIsCached(null);
    }
  };

  const handleFetchProperty = async () => {
    const validation = validateFinnInput(finnInput);
    
    if (!validation.isValid || !validation.finnCode) {
      toast({
        title: "Ugyldig Finn-kode",
        description: "Vennligst oppgi en gyldig Finn-kode eller URL",
        variant: "destructive"
      });
      return;
    }

    // Check if user has credits (unless cached)
    if (!isCached && !hasCredits) {
      toast({
        title: "Ingen kreditter",
        description: "Du trenger 1 kreditt for å hente ny eiendom. Kjøp kreditter for å fortsette.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('finn-property-scraper', {
        body: { finnCode: validation.finnCode }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Kunne ikke hente eiendomsdata');
      }

      if (data.success && data.data) {
        console.log('✅ Property data received:', data.data);
        setPropertyData(data.data);
        setCached(data.cached || false);
        setError(null);
        
        const toastMessage = data.cached 
          ? 'Hentet fra cache (gratis)' 
          : data.message || '1 kreditt brukt';
        
        toast({
          title: "Eiendom hentet!",
          description: `Finn-kode: ${validation.finnCode} - ${toastMessage}`,
        });
        
        // Call the parent callback if provided
        if (onPropertyDataReceived) {
          onPropertyDataReceived(data.data);
        }
      } else {
        throw new Error(data.message || 'Kunne ikke hente eiendomsdata');
      }

    } catch (error: any) {
      console.error('Error fetching property:', error);
      const errorMessage = error.message || 'Kunne ikke hente eiendomsdata';
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

  // Show for all users, but with different states
  const canFetch = hasCredits || isCached;

  return (
    <Card className={`${className} ${cached ? 'border-green-300' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5" />
              Finn.no Eiendomsdata
              {hasCredits && (
                <Badge variant="secondary" className="ml-2">
                  <Wallet className="w-3 h-3 mr-1" />
                  {credits} {credits === 1 ? 'kreditt' : 'kreditter'}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Automatisk henting av eiendomsdata og kostnadsestimater
            </CardDescription>
          </div>
          {cached && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Cached
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasCredits && !isCached && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Ingen kreditter tilgjengelig.</strong>
              <br />
              Gratisbrukere: Fyll inn eiendomsdata manuelt nedenfor.
              <br />
              Pro-brukere: Kjøp kreditter for automatisk henting.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="finn-input">Finn-kode eller URL</Label>
          <Input
            id="finn-input"
            type="text"
            placeholder="Eks: 12345678 eller https://www.finn.no/realestate/homes/ad.html?finnkode=12345678"
            value={finnInput}
            onChange={(e) => handleFinnInputChange(e.target.value)}
            disabled={disabled || loading}
          />
          <p className="text-xs text-muted-foreground">
            Lim inn Finn-koden (8-9 siffer) eller hele URL-en fra Finn.no
          </p>
        </div>

        {/* Cost indicator */}
        {finnInput && isCached !== null && (
          <Alert className={isCached ? "border-green-500 bg-green-50" : "border-yellow-500 bg-yellow-50"}>
            {isCached ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ✨ Denne eiendommen er allerede hentet - <strong>GRATIS!</strong>
                  <br />
                  <span className="text-xs">Sist oppdatert: {cachedDate}</span>
                </AlertDescription>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  🎫 Henting av ny eiendom koster <strong>1 kreditt</strong>
                  <br />
                  <span className="text-xs">
                    Du har {credits} {credits === 1 ? 'kreditt' : 'kreditter'} tilgjengelig
                  </span>
                </AlertDescription>
              </>
            )}
          </Alert>
        )}

        <Button 
          onClick={handleFetchProperty} 
          disabled={loading || disabled || !finnInput.trim() || !canFetch}
          size="sm"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              Henter data...
            </>
          ) : isCached ? (
            <>
              <Download className="w-3 h-3 mr-2" />
              Hent fra cache (gratis)
            </>
          ) : (
            <>
              <Download className="w-3 h-3 mr-2" />
              Hent eiendomsdata (1 kreditt)
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
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
