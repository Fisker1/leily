import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, TrendingUp, Home, DollarSign, Calculator, AlertCircle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePropertyData } from "@/hooks/usePropertyData";
import { formatNumberWithSpaces } from "@/lib/utils";

const RentalMap = () => {
  const { isPro } = useSubscription();
  const { user } = useAuth();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('kommune');
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [mapboxgl, setMapboxgl] = useState<any>(null);
  const [mapboxError, setMapboxError] = useState<string | null>(null);
  
  // Dynamically load Mapbox GL
  useEffect(() => {
    const loadMapbox = async () => {
      try {
        const mapboxModule = await import('mapbox-gl');
        await import('mapbox-gl/dist/mapbox-gl.css');
        setMapboxgl(mapboxModule.default);
      } catch (error) {
        setMapboxError(error instanceof Error ? error.message : 'Unknown error');
      }
    };
    
    loadMapbox();
  }, []);

  // Layer toggles
  const [showMyProperties, setShowMyProperties] = useState(true);
  const [showRentalProperties, setShowRentalProperties] = useState(true);
  const [showCalculationProperties, setShowCalculationProperties] = useState(true);
  const [showMarketData, setShowMarketData] = useState(false);

  const { properties, calculationProperties, loading: dataLoading } = usePropertyData();

  // Fetch Mapbox token from Supabase Edge Function
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) {
          toast({
            title: "Kartfeil",
            description: `Kunne ikke laste inn kartfunksjonalitet: ${error.message}`,
            variant: "destructive",
          });
          return;
        }

        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          toast({
            title: "Kartfeil", 
            description: "Ingen Mapbox-token mottatt",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Kartfeil", 
          description: `Kunne ikke laste inn kartfunksjonalitet: ${error instanceof Error ? error.message : 'Ukjent feil'}`,
          variant: "destructive",
        });
      }
    };

    if (isPro) {
      fetchMapboxToken();
    }
  }, [isPro, toast]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !mapboxgl || !isPro) {
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [10.7522, 59.9139], // Oslo center
        zoom: 8,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({ visualizePitch: true }),
        'top-right'
      );

      map.current.on('load', () => {
        // Map is loaded
      });

    } catch (error) {
      toast({
        title: "Kartfeil",
        description: `Kunne ikke initialisere kart: ${error instanceof Error ? error.message : 'Ukjent feil'}`,
        variant: "destructive",
      });
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, isPro, mapboxgl, toast]);

  // Render Pro upgrade prompt if not Pro user
  const renderProUpgrade = () => (
    <div className="bg-muted/50 p-6 rounded-lg text-center">
      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="font-semibold mb-2">Oppgrader til Pro</h3>
      <p className="text-muted-foreground mb-4">
        Få tilgang til interaktive kart med markedsdata, avkastning og leietrender for hele Norge
      </p>
      <Badge variant="secondary" className="mb-4">Pro-funksjon</Badge>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-sm">
        <div className="bg-background p-4 rounded-lg">
          <TrendingUp className="h-5 w-5 text-green-600 mb-2" />
          <h4 className="font-medium">Markedsanalyser</h4>
          <p className="text-muted-foreground">Se avkastning og leiepriser per område</p>
        </div>
        <div className="bg-background p-4 rounded-lg">
          <MapPin className="h-5 w-5 text-blue-600 mb-2" />
          <h4 className="font-medium">Geografisk oversikt</h4>
          <p className="text-muted-foreground">Interaktive kart ned til kommune-nivå</p>
        </div>
      </div>
    </div>
  );

  // Show error if Mapbox failed to load
  if (mapboxError) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Kartfeil
            </CardTitle>
            <CardDescription>
              Kunne ikke laste Mapbox GL library
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Teknisk feil:</strong> {mapboxError}
              </p>
              <p className="text-sm">
                Kartet krever Mapbox GL JavaScript library for å fungere. 
                Dette kan skyldes nettverksproblemer eller at pakken ikke er tilgjengelig.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading while Mapbox is loading
  if (!mapboxgl) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Leiekart - Laster...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center h-96 bg-muted/50 rounded-lg">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Laster kartbibliotek...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Leiekart - Avkastning per område
          </CardTitle>
          <CardDescription>
            Utforsk avkastning og leiepriser geografisk basert på markedsdata
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-sm font-medium whitespace-nowrap">Geografinivå:</label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kommune">Kommune</SelectItem>
                  <SelectItem value="bydel">Bydel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Map content or upgrade prompt */}
          {!isPro ? renderProUpgrade() : 
           !mapboxToken || dataLoading ? (
            <div className="flex items-center justify-center h-96 bg-muted/50 rounded-lg">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">
                  {!mapboxToken ? 'Laster inn kart...' : 'Henter eiendommer...'}
                </p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div ref={mapContainer} className="h-96 w-full rounded-lg shadow-medium" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RentalMap;