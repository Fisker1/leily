import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, TrendingUp, Home, DollarSign, Calculator } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useOptimizedPropertyData } from "@/hooks/useOptimizedPropertyData";
import { formatNumberWithSpaces } from "@/lib/utils";

const RentalMap = () => {
  const { isPro } = useSubscription();
  const { user } = useAuth();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Layer toggles
  const [showMyProperties, setShowMyProperties] = useState(true);
  const [showCalculationProperties, setShowCalculationProperties] = useState(true);

  // Get data
  const { properties, calculationProperties, loading: dataLoading } = useOptimizedPropertyData();

  // Fetch Mapbox token
  const fetchMapboxToken = async () => {
    try {
      console.log('🔑 Fetching Mapbox token...');
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      
      if (error) {
        throw new Error(`Edge function failed: ${error.message}`);
      }

      if (data?.success && data?.token && data.token.startsWith('pk.')) {
        console.log('✅ Valid Mapbox token received');
        setMapboxToken(data.token);
        return data.token;
      } else {
        throw new Error('Invalid token response');
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch token:', error);
      setError(`Kunne ikke hente Mapbox token: ${error.message}`);
      return null;
    }
  };

  // Initialize map once
  useEffect(() => {
    let mapboxgl: any = null;
    let mapInstance: any = null;

    const initializeMap = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Load Mapbox GL
        const mapboxModule = await import('mapbox-gl');
        mapboxgl = mapboxModule.default;
        console.log('✅ Mapbox GL loaded');

        // Get token
        const token = mapboxToken || await fetchMapboxToken();
        if (!token) return;

        // Set access token
        mapboxgl.accessToken = token;

        // Create map
        if (mapContainer.current && !map.current) {
          console.log('🗺️ Creating map instance...');
          
          mapInstance = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [10.7522, 59.9139], // Oslo
            zoom: 6,
            attributionControl: false
          });

          map.current = mapInstance;

          // Add navigation controls
          mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');

          // Wait for map to load
          mapInstance.on('load', () => {
            console.log('✅ Map loaded successfully');
            setLoading(false);
            addMarkers();
          });

          // Handle errors
          mapInstance.on('error', (e: any) => {
            console.error('❌ Map error:', e);
            setError('Kartfeil oppstod');
          });
        }
      } catch (error: any) {
        console.error('❌ Map initialization failed:', error);
        setError(`Kunne ikke initialisere kartet: ${error.message}`);
        setLoading(false);
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
      if (map.current) {
        map.current = null;
      }
      markers.current.forEach(marker => marker?.remove());
      markers.current = [];
    };
  }, [user, mapboxToken]);

  // Clear markers
  const clearMarkers = () => {
    markers.current.forEach(marker => marker?.remove());
    markers.current = [];
  };

  // Add markers to map
  const addMarkers = async () => {
    if (!map.current || loading || dataLoading) {
      console.log('⚠️ Map not ready for markers');
      return;
    }

    console.log('🎯 Adding markers to map...');
    clearMarkers();

    let allMarkers: any[] = [];
    let bounds: any = null;

    // Import mapbox for bounds calculation
    try {
      const mapboxModule = await import('mapbox-gl');
      const mapboxgl = mapboxModule.default;
      bounds = new mapboxgl.LngLatBounds();
    } catch (error) {
      console.error('Failed to import mapbox for bounds:', error);
      return;
    }

    // Add property markers
    if (showMyProperties && properties && properties.length > 0) {
      console.log(`📍 Adding ${properties.length} property markers`);
      
      properties.forEach((property) => {
        if (property.coordinates && property.coordinates.length === 2) {
          const el = document.createElement('div');
          el.style.cssText = `
            width: 14px;
            height: 14px;
            background: #3b82f6;
            border: 2px solid white;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          `;

          const mapboxModule = require('mapbox-gl');
          const popup = new mapboxModule.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px; font-family: system-ui;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${property.address}</h3>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">Type: ${property.property_type || 'Ikke spesifisert'}</p>
              ${property.monthly_rent ? `<p style="margin: 4px 0; font-size: 12px; color: #666;">Månedlig leie: ${formatNumberWithSpaces(property.monthly_rent)} NOK</p>` : ''}
              ${property.current_value ? `<p style="margin: 4px 0; font-size: 12px; color: #666;">Verdi: ${formatNumberWithSpaces(property.current_value)} NOK</p>` : ''}
              ${property.primary_residence ? '<p style="margin: 4px 0; font-size: 12px; color: #059669; font-weight: 500;">🏠 Primærbolig</p>' : ''}
            </div>
          `);

          const marker = new mapboxModule.Marker(el)
            .setLngLat([property.coordinates[0], property.coordinates[1]])
            .setPopup(popup)
            .addTo(map.current);

          allMarkers.push(marker);
          bounds.extend([property.coordinates[0], property.coordinates[1]]);
        }
      });
    }

    // Add calculation markers
    if (showCalculationProperties && calculationProperties && calculationProperties.length > 0) {
      console.log(`🧮 Adding ${calculationProperties.length} calculation markers`);
      
      calculationProperties.forEach((calc) => {
        if (calc.coordinates && calc.coordinates.length === 2) {
          const el = document.createElement('div');
          el.style.cssText = `
            width: 14px;
            height: 14px;
            background: #f59e0b;
            border: 2px solid white;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          `;

          const mapboxModule = require('mapbox-gl');
          const popup = new mapboxModule.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px; font-family: system-ui;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${calc.property_address}</h3>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">Kalkyle: ${calc.calculation_data?.calculation_name || 'Uten navn'}</p>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">Finn-kode: ${calc.finn_code}</p>
              ${calc.results_data?.totalPrice ? `<p style="margin: 4px 0; font-size: 12px; color: #666;">Pris: ${formatNumberWithSpaces(calc.results_data.totalPrice)} NOK</p>` : ''}
            </div>
          `);

          const marker = new mapboxModule.Marker(el)
            .setLngLat([calc.coordinates[0], calc.coordinates[1]])
            .setPopup(popup)
            .addTo(map.current);

          allMarkers.push(marker);
          bounds.extend([calc.coordinates[0], calc.coordinates[1]]);
        }
      });
    }

    // Update markers ref
    markers.current = allMarkers;

    // Center map on markers
    if (allMarkers.length > 0) {
      console.log(`🎯 Centering map on ${allMarkers.length} markers`);
      
      if (allMarkers.length === 1) {
        // Single marker: center on it
        const lngLat = allMarkers[0].getLngLat();
        map.current.setCenter([lngLat.lng, lngLat.lat]);
        map.current.setZoom(12);
      } else {
        // Multiple markers: fit bounds
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 14
        });
      }
    } else {
      // No markers: center on Norway
      console.log('📍 No markers found, centering on Norway');
      map.current.setCenter([10.7522, 59.9139]);
      map.current.setZoom(6);
    }

    console.log(`✅ Added ${allMarkers.length} markers total`);
  };

  // Update markers when data or toggles change
  useEffect(() => {
    if (!loading && !dataLoading) {
      addMarkers();
    }
  }, [showMyProperties, showCalculationProperties, properties, calculationProperties, loading, dataLoading]);

  if (!user) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <CardContent>
          <p className="text-muted-foreground">Logg inn for å se kartet</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <CardContent>
          <p className="text-red-500">{error}</p>
          <Button 
            onClick={() => {
              setError(null);
              fetchMapboxToken();
            }} 
            className="mt-4"
          >
            Prøv igjen
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <CardTitle>Leiekart - Avkastning per område</CardTitle>
          </div>
          <CardDescription>
            Utforsk avkastning og leiepriser geografisk basert på markedsdata
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Map Controls */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="my-properties"
                  checked={showMyProperties}
                  onCheckedChange={setShowMyProperties}
                />
                <Label htmlFor="my-properties" className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full border border-white"></div>
                  Mine eiendommer
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="calculation-properties"
                  checked={showCalculationProperties}
                  onCheckedChange={setShowCalculationProperties}
                />
                <Label htmlFor="calculation-properties" className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full border border-white"></div>
                  Kalkulasjoner
                </Label>
              </div>
            </div>

            {/* Map Container */}
            <div className="relative w-full h-[500px] rounded-lg overflow-hidden border">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Laster kart...</span>
                  </div>
                </div>
              )}
              <div ref={mapContainer} className="w-full h-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RentalMap;