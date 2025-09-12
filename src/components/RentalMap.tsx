import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, TrendingUp, AlertCircle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const RentalMap = () => {
  const { isPro } = useSubscription();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('kommune');
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [marketData, setMarketData] = useState<any[]>([]);

  // Fetch Mapbox token from Supabase Edge Function
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) {
          console.error('Error fetching Mapbox token:', error);
          toast({
            title: "Kartfeil",
            description: "Kunne ikke laste inn kartfunksjonalitet",
            variant: "destructive",
          });
          return;
        }

        if (data?.token) {
          setMapboxToken(data.token);
        }
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
        toast({
          title: "Kartfeil", 
          description: "Kunne ikke laste inn kartfunksjonalitet",
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
    if (!mapContainer.current || !mapboxToken || !isPro) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [10.7522, 59.9139], // Oslo center
      zoom: 8,
    });

    // Add navigation controls  
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add some demo yield data markers
    map.current.on('load', () => {
      // Demo data for Norwegian municipalities with rental yields
      const demoData = [
        { name: 'Oslo', coordinates: [10.7522, 59.9139], yield: 4.2, avgRent: 18500 },
        { name: 'Bergen', coordinates: [5.3221, 60.3913], yield: 5.1, avgRent: 14200 },
        { name: 'Trondheim', coordinates: [10.3951, 63.4305], yield: 5.8, avgRent: 12800 },
        { name: 'Stavanger', coordinates: [5.7331, 58.9700], yield: 4.7, avgRent: 15600 },
        { name: 'Drammen', coordinates: [10.2049, 59.7439], yield: 5.3, avgRent: 13400 },
      ];

      demoData.forEach((location) => {
        // Create marker element with yield-based color
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundColor = location.yield > 5.0 ? '#22c55e' : location.yield > 4.5 ? '#f59e0b' : '#ef4444';
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';

        // Create popup
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div class="font-medium text-sm">
            <h3 class="font-bold">${location.name}</h3>
            <p>Avkastning: <span class="font-semibold ${location.yield > 5.0 ? 'text-green-600' : location.yield > 4.5 ? 'text-yellow-600' : 'text-red-600'}">${location.yield}%</span></p>
            <p>Gj.snitt leie: ${location.avgRent.toLocaleString()} kr</p>
          </div>
        `);

        // Add marker to map
        new mapboxgl.Marker(el)
          .setLngLat(location.coordinates as [number, number])
          .setPopup(popup)
          .addTo(map.current!);
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, isPro]);

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    // TODO: Implement region-specific data loading
    toast({
      title: "Kommer snart",
      description: `${value === 'kommune' ? 'Kommune' : 'Bydel'}-nivå data kommer i neste versjon`,
    });
  };

  if (!isPro) {
    return (
      <div className="space-y-6">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Leiekart - Pro-funksjon
            </CardTitle>
            <CardDescription>
              Visualiser avkastning og leiepriser geografisk for å finne de beste investeringsmulighetene
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Geografinivå:</label>
              <Select value={selectedRegion} onValueChange={handleRegionChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kommune">Kommune</SelectItem>
                  <SelectItem value="bydel">Bydel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Høy avkastning (5%+)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Middels (4-5%)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Lav (&lt;4%)</span>
              </div>
            </div>
          </div>

          {!mapboxToken ? (
            <div className="flex items-center justify-center h-96 bg-muted/50 rounded-lg">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Laster inn kart...</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div ref={mapContainer} className="h-96 rounded-lg shadow-medium" />
              
              <Card className="absolute top-4 right-4 w-64 bg-background/95 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Demo data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3 w-3 text-blue-500" />
                      <span>Klikk på markørene for detaljer</span>
                    </div>
                    <p className="text-muted-foreground">
                      Viser eksempeldata for større byer. Fullstendig SSB-integrasjon kommer snart.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Beste avkastning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">5.8%</div>
            <p className="text-xs text-muted-foreground">Trondheim</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Høyeste leie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">18,500 kr</div>
            <p className="text-xs text-muted-foreground">Oslo (gjennomsnitt)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Områder analysert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">5</div>
            <p className="text-xs text-muted-foreground">Store byer (demo)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RentalMap;