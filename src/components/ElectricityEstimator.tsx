import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatNumberWithSpaces } from '@/lib/utils';

interface ElectricityEstimatorProps {
  size_sqm?: number;
  bedrooms?: number;
  property_type?: string;
  location?: string;
  onEstimateComplete?: (estimatedCost: number) => void;
  disabled?: boolean;
}

export const ElectricityEstimator = ({
  size_sqm,
  bedrooms,
  property_type,
  location,
  onEstimateComplete,
  disabled = false,
}: ElectricityEstimatorProps) => {
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [estimationMethod, setEstimationMethod] = useState<string>('');

  const handleEstimate = async () => {
    if (!size_sqm || !bedrooms) {
      toast({
        title: 'Mangler data',
        description: 'Trenger kvadratmeter og antall soverom for å estimere strøm',
        variant: 'destructive',
      });
      return;
    }

    setIsEstimating(true);
    try {
      const { data, error } = await supabase.functions.invoke('estimate-electricity', {
        body: {
          size_sqm,
          bedrooms,
          property_type: property_type || 'Leilighet',
          location: location || 'Norge',
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setEstimatedCost(data.estimated_monthly_cost);
      setEstimationMethod(data.method);
      
      if (onEstimateComplete) {
        onEstimateComplete(data.estimated_monthly_cost);
      }

      toast({
        title: 'Strøm estimert',
        description: `Estimert månedlig strømkostnad: ${formatNumberWithSpaces(data.estimated_monthly_cost)} kr`,
      });
    } catch (error: unknown) {
      console.error('Error estimating electricity:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('429')) {
        toast({
          title: 'For mange forespørsler',
          description: 'Vennligst vent litt før du prøver igjen',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Feil',
          description: 'Kunne ikke estimere strømkostnad',
          variant: 'destructive',
        });
      }
    } finally {
      setIsEstimating(false);
    }
  };

  const handleToggle = (enabled: boolean) => {
    setIsEnabled(enabled);
    if (enabled && !estimatedCost) {
      handleEstimate();
    } else if (!enabled) {
      setEstimatedCost(null);
      if (onEstimateComplete) {
        onEstimateComplete(0);
      }
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">AI Strømestimering</CardTitle>
              <CardDescription className="text-sm">
                Automatisk estimering basert på størrelse og type
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={disabled || !size_sqm || !bedrooms}
          />
        </div>
      </CardHeader>
      
      {isEnabled && (
        <CardContent>
          {isEstimating ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Estimerer strømkostnad...</span>
            </div>
          ) : estimatedCost ? (
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">
                  {formatNumberWithSpaces(estimatedCost)} kr
                </span>
                <span className="text-sm text-muted-foreground">/ måned</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {estimationMethod === 'ai' 
                  ? 'Estimert med OpenAI basert på norske strømpriser 2025'
                  : 'Basert på forenklet formel'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEstimate}
                disabled={isEstimating}
                className="mt-2"
              >
                Oppdater estimat
              </Button>
            </div>
          ) : null}
        </CardContent>
      )}
    </Card>
  );
};
