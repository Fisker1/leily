import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useOptimizedPropertyData } from "@/hooks/useOptimizedPropertyData";
import { formatNumberWithSpaces } from "@/lib/utils";

const RentalMap = () => {
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
  const [showRentalProperties, setShowRentalProperties] = useState(true);
  const [showCalculationProperties, setShowCalculationProperties] = useState(true);
  const [showMarketData, setShowMarketData] = useState(true);

  // Get data
  const { properties, calculationProperties, loading: dataLoading } = useOptimizedPropertyData();

  // Fetch Mapbox token
  const fetchMapboxToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      
      if (error) {
        throw new Error(`Edge function failed: ${error.message}`);
      }

      if (data?.success && data?.token && data.token.startsWith('pk.')) {
        setMapboxToken(data.token);
        return data.token;
      } else {
        throw new Error('Invalid token response');
      }
    } catch (error: any) {
      setError(`Kunne ikke hente Mapbox token: ${error.message}`);
      return null;
    }
  };

  // Clear markers
  const clearMarkers = () => {
    markers.current.forEach(marker => {
      try {
        marker?.remove();
      } catch (e) {
        // Ignore cleanup errors
      }
    });
    markers.current = [];
  };

  // Add markers to map
  const addMarkers = async () => {
    if (!map.current || loading || dataLoading) {
      return;
    }

    clearMarkers();

    let allMarkers: any[] = [];
    let bounds: any = null;

    try {
      const mapboxModule = await import('mapbox-gl');
      const mapboxgl = mapboxModule.default;
      bounds = new mapboxgl.LngLatBounds();

      // Add property markers
      if (showMyProperties && properties && properties.length > 0) {
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

            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div style="padding: 8px; font-family: system-ui;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${property.address}</h3>
                <p style="margin: 4px 0; font-size: 12px; color: #666;">Type: ${property.property_type || 'Ikke spesifisert'}</p>
                ${property.monthly_rent ? `<p style="margin: 4px 0; font-size: 12px; color: #666;">Månedlig leie: ${formatNumberWithSpaces(property.monthly_rent)} NOK</p>` : ''}
                ${property.current_value ? `<p style="margin: 4px 0; font-size: 12px; color: #666;">Verdi: ${formatNumberWithSpaces(property.current_value)} NOK</p>` : ''}
                ${property.primary_residence ? '<p style="margin: 4px 0; font-size: 12px; color: #059669; font-weight: 500;">🏠 Primærbolig</p>' : ''}
              </div>
            `);

            const marker = new mapboxgl.Marker(el)
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

            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div style="padding: 8px; font-family: system-ui;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${calc.property_address}</h3>
                <p style="margin: 4px 0; font-size: 12px; color: #666;">Kalkyle: ${calc.calculation_data?.calculation_name || 'Uten navn'}</p>
                <p style="margin: 4px 0; font-size: 12px; color: #666;">Finn-kode: ${calc.finn_code}</p>
                ${calc.results_data?.totalPrice ? `<p style="margin: 4px 0; font-size: 12px; color: #666;">Pris: ${formatNumberWithSpaces(calc.results_data.totalPrice)} NOK</p>` : ''}
              </div>
            `);

            const marker = new mapboxgl.Marker(el)
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
        if (allMarkers.length === 1) {
          const lngLat = allMarkers[0].getLngLat();
          map.current.setCenter([lngLat.lng, lngLat.lat]);
          map.current.setZoom(12);
        } else {
          map.current.fitBounds(bounds, {
            padding: 50,
            maxZoom: 14
          });
        }
      } else {
        map.current.setCenter([10.7522, 59.9139]);
        map.current.setZoom(6);
      }
    } catch (error) {
      console.error('Failed to add markers:', error);
    }
  };

  // Initialize map once
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let mapboxgl: any = null;
    let mapInstance: any = null;

    const initializeMap = async () => {
      try {
        // Load Mapbox GL
        const mapboxModule = await import('mapbox-gl');
        mapboxgl = mapboxModule.default;

        // Get token
        const token = mapboxToken || await fetchMapboxToken();
        if (!token) return;

        // Set access token
        mapboxgl.accessToken = token;

        // Create map
        if (mapContainer.current && !map.current) {
          mapInstance = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/light-v11',
            center: [10.7522, 59.9139], // Oslo
            zoom: 6,
            attributionControl: false,
            preserveDrawingBuffer: true
          });

          map.current = mapInstance;

          // Add navigation controls
          const navControl = new mapboxgl.NavigationControl();
          mapInstance.addControl(navControl, 'top-right');

          // Wait for map to load and handle style loading
          mapInstance.on('load', () => {
            console.log('✅ Map loaded successfully');
            setLoading(false);
            setError(null);
            addMarkers();
          });

          mapInstance.on('styledata', () => {
            console.log('🎨 Map style loaded');
          });

          // Handle map errors more specifically
          mapInstance.on('error', (e: any) => {
            console.log('❌ Map error:', e);
            // Only set error for critical issues, not tile loading errors
            if (e.error && e.error.status === 401) {
              setError('Kartfeil: Autorisasjonsfeil med Mapbox token');
              setLoading(false);
            } else if (e.error && e.error.message && e.error.message.includes('network')) {
              setError('Kartfeil: Nettverksfeil - sjekk internettforbindelsen');
              setLoading(false);
            }
            // Ignore tile-specific errors as they're usually temporary
          });

          // Force map to refresh after a short delay to help with tile loading
          setTimeout(() => {
            if (mapInstance && mapInstance.isStyleLoaded()) {
              mapInstance.resize();
              mapInstance.redraw();
            }
          }, 1000);
        }
      } catch (error: any) {
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
      clearMarkers();
    };
  }, [user, mapboxToken]);

  // Update markers when data or toggles change
  useEffect(() => {
    if (!loading && !dataLoading) {
      addMarkers();
    }
  }, [
    showMyProperties, 
    showRentalProperties, 
    showCalculationProperties, 
    showMarketData, 
    properties, 
    calculationProperties, 
    loading, 
    dataLoading
  ]);

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
        <CardContent className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button 
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchMapboxToken();
            }}
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
                  id="rental-properties"
                  checked={showRentalProperties}
                  onCheckedChange={setShowRentalProperties}
                />
                <Label htmlFor="rental-properties" className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                  Utleie-enheter
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

              <div className="flex items-center space-x-2">
                <Switch
                  id="market-data"
                  checked={showMarketData}
                  onCheckedChange={setShowMarketData}
                />
                <Label htmlFor="market-data" className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full border border-white"></div>
                  Markedsdata
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