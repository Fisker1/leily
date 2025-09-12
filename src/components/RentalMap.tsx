import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, TrendingUp } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const RentalMap = () => {
  const { isPro } = useSubscription();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [mapboxgl, setMapboxgl] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load Mapbox GL
  useEffect(() => {
    const loadMapbox = async () => {
      try {
        const mapboxModule = await import('mapbox-gl');
        await import('mapbox-gl/dist/mapbox-gl.css');
        setMapboxgl(mapboxModule.default);
      } catch (error) {
        console.error('Failed to load Mapbox GL:', error);
        toast({
          title: "Kartfeil",
          description: "Kunne ikke laste Mapbox GL biblioteket",
          variant: "destructive",
        });
      }
    };
    loadMapbox();
  }, [toast]);

  // Fetch Mapbox token
  useEffect(() => {
    if (!isPro) {
      setLoading(false);
      return;
    }

    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) {
          throw error;
        }

        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          throw new Error('Ingen token mottatt');
        }
      } catch (error) {
        console.error('Token fetch error:', error);
        toast({
          title: "Kartfeil",
          description: "Kunne ikke hente Mapbox token",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [isPro, toast]);

  // Initialize map
  useEffect(() => {
    if (!isPro || !mapboxToken || !mapboxgl || !mapContainer.current) {
      return;
    }

    console.log('Initializing map with token:', mapboxToken.substring(0, 10) + '...');

    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [10.7522, 59.9139], // Oslo
        zoom: 6,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );

      map.current.on('load', () => {
        console.log('Map loaded successfully!');
        
        // Add a test marker
        new mapboxgl.Marker()
          .setLngLat([10.7522, 59.9139])
          .addTo(map.current);
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
      });

    } catch (error) {
      console.error('Map initialization error:', error);
      toast({
        title: "Kartfeil",
        description: "Kunne ikke initialisere kartet",
        variant: "destructive",
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [isPro, mapboxToken, mapboxgl, toast]);

  if (!isPro) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Leiekart - Pro-funksjon
          </CardTitle>
          <CardDescription>
            Visualiser avkastning og leiepriser geografisk
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 p-6 rounded-lg text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Oppgrader til Pro</h3>
            <p className="text-muted-foreground mb-4">
              Få tilgang til interaktive kart med markedsdata og avkastning
            </p>
            <Badge variant="secondary">Pro-funksjon</Badge>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-sm">
              <div className="bg-background p-4 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 mb-2" />
                <h4 className="font-medium">Markedsanalyser</h4>
                <p className="text-muted-foreground">Se avkastning per område</p>
              </div>
              <div className="bg-background p-4 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-600 mb-2" />
                <h4 className="font-medium">Geografisk oversikt</h4>
                <p className="text-muted-foreground">Interaktive kart</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Leiekart
        </CardTitle>
        <CardDescription>
          Interaktivt kart med markedsdata og avkastning
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-96 bg-muted/50 rounded-lg">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Laster kart...</p>
            </div>
          </div>
        ) : (
          <div 
            ref={mapContainer} 
            className="h-96 w-full rounded-lg border"
            style={{ minHeight: '400px' }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default RentalMap;