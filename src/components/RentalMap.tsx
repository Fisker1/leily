import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useOptimizedPropertyData } from "@/hooks/useOptimizedPropertyData";
import { formatNumberWithSpaces } from "@/lib/utils";

const RentalMap = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
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
      console.log('🔑 Fetching Mapbox token...');
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      
      if (error) {
        throw new Error(`Token error: ${error.message}`);
      }

      if (data?.success && data?.token && data.token.startsWith('pk.')) {
        console.log('✅ Valid Mapbox token received');
        setMapboxToken(data.token);
        return data.token;
      } else {
        throw new Error('Invalid token response');
      }
    } catch (error: any) {
      console.error('❌ Token fetch failed:', error);
      setError(`Token error: ${error.message}`);
      return null;
    }
  };

  // Clear markers
  const clearMarkers = () => {
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
  };

  // Add markers to map
  const addMarkers = () => {
    if (!map.current || loading || dataLoading) return;

    console.log('🔧 Adding markers to map...');
    clearMarkers();

    const bounds = new mapboxgl.LngLatBounds();
    let hasMarkers = false;

    // Add property markers
    if (showMyProperties && properties?.length > 0) {
      properties.forEach((property) => {
        if (property.coordinates && property.coordinates.length === 2) {
          const el = document.createElement('div');
          el.className = 'marker-property';
          el.style.cssText = `
            width: 16px;
            height: 16px;
            background: #3b82f6;
            border: 2px solid white;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          `;

          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 12px; font-family: system-ui; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1f2937;">${property.address}</h3>
              <div style="font-size: 12px; color: #6b7280; line-height: 1.4;">
                <p style="margin: 2px 0;">Type: ${property.property_type || 'Ikke spesifisert'}</p>
                ${property.monthly_rent ? `<p style="margin: 2px 0;">Månedlig leie: ${formatNumberWithSpaces(property.monthly_rent)} NOK</p>` : ''}
                ${property.current_value ? `<p style="margin: 2px 0;">Verdi: ${formatNumberWithSpaces(property.current_value)} NOK</p>` : ''}
                ${property.primary_residence ? '<p style="margin: 2px 0; color: #059669; font-weight: 500;">🏠 Primærbolig</p>' : ''}
              </div>
            </div>
          `);

          const marker = new mapboxgl.Marker(el)
            .setLngLat([property.coordinates[0], property.coordinates[1]])
            .setPopup(popup)
            .addTo(map.current);

          markers.current.push(marker);
          bounds.extend([property.coordinates[0], property.coordinates[1]]);
          hasMarkers = true;
        }
      });
    }

    // Add calculation markers
    if (showCalculationProperties && calculationProperties?.length > 0) {
      calculationProperties.forEach((calc) => {
        if (calc.coordinates && calc.coordinates.length === 2) {
          const el = document.createElement('div');
          el.className = 'marker-calculation';
          el.style.cssText = `
            width: 16px;
            height: 16px;
            background: #f59e0b;
            border: 2px solid white;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          `;

          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 12px; font-family: system-ui; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1f2937;">${calc.property_address}</h3>
              <div style="font-size: 12px; color: #6b7280; line-height: 1.4;">
                <p style="margin: 2px 0;">Kalkyle: ${calc.calculation_data?.calculation_name || 'Uten navn'}</p>
                <p style="margin: 2px 0;">Finn-kode: ${calc.finn_code}</p>
                ${calc.results_data?.totalPrice ? `<p style="margin: 2px 0;">Pris: ${formatNumberWithSpaces(calc.results_data.totalPrice)} NOK</p>` : ''}
              </div>
            </div>
          `);

          const marker = new mapboxgl.Marker(el)
            .setLngLat([calc.coordinates[0], calc.coordinates[1]])
            .setPopup(popup)
            .addTo(map.current);

          markers.current.push(marker);
          bounds.extend([calc.coordinates[0], calc.coordinates[1]]);
          hasMarkers = true;
        }
      });
    }

    // Center map on markers
    if (hasMarkers) {
      if (markers.current.length === 1) {
        const lngLat = markers.current[0].getLngLat();
        map.current.setCenter([lngLat.lng, lngLat.lat]);
        map.current.setZoom(13);
      } else {
        map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
      }
    } else {
      // Default to Norway center
      map.current.setCenter([10.7522, 59.9139]);
      map.current.setZoom(6);
    }

    console.log(`✅ Added ${markers.current.length} markers to map`);
  };

  // Initialize map
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const initializeMap = async () => {
      try {
        console.log('🔧 Initializing rental map...');
        
        // Get token first
        const token = mapboxToken || await fetchMapboxToken();
        if (!token) {
          console.error('❌ No token available');
          return;
        }

        // Set access token
        mapboxgl.accessToken = token;
        console.log('✅ Mapbox token set');

        // Create map with simple OpenStreetMap-style
        if (mapContainer.current && !map.current) {
          try {
            map.current = new mapboxgl.Map({
              container: mapContainer.current,
              style: {
                version: 8,
                sources: {
                  'osm': {
                    type: 'raster',
                    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                    tileSize: 256,
                    attribution: '© OpenStreetMap contributors'
                  }
                },
                layers: [
                  {
                    id: 'osm',
                    type: 'raster',
                    source: 'osm'
                  }
                ]
              },
              center: [10.7522, 59.9139], // Oslo center
              zoom: 6,
              attributionControl: true
            });

            console.log('✅ Map created with OpenStreetMap tiles');

            // Add navigation controls
            map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

            // Setup map events
            map.current.on('load', () => {
              console.log('✅ Map loaded successfully');
              setLoading(false);
              setError(null);
              addMarkers();
            });

            map.current.on('error', (e: any) => {
              console.error('❌ Map error:', e);
              // Don't stop for tile loading errors
              if (!e.error || (e.error && e.error.status !== 403)) {
                setError('Kartfeil: Kan ikke laste kartet');
                setLoading(false);
              }
            });

            // Timeout fallback
            setTimeout(() => {
              if (loading) {
                console.log('🕐 Map loading timeout - forcing ready state');
                setLoading(false);
                addMarkers();
              }
            }, 5000);

          } catch (mapError) {
            console.error('❌ Map creation failed:', mapError);
            setError(`Kartfeil: ${mapError}`);
            setLoading(false);
          }
        }
      } catch (error: any) {
        console.error('❌ Map init failed:', error);
        setError(`Initialisering feilet: ${error.message}`);
        setLoading(false);
      }
    };

    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
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
    showCalculationProperties, 
    properties, 
    calculationProperties, 
    loading, 
    dataLoading
  ]);

  const resetMap = () => {
    console.log('🔄 Resetting map...');
    setError(null);
    setLoading(true);
    setMapboxToken(null);
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    clearMarkers();
  };

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
        <CardContent className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold">Kartfeil</h3>
          </div>
          <p className="text-red-600 text-sm">{error}</p>
          <Button onClick={resetMap} size="sm">
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
            <div className="flex flex-wrap gap-4">
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
                  id="calculations"
                  checked={showCalculationProperties}
                  onCheckedChange={setShowCalculationProperties}
                />
                <Label htmlFor="calculations" className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full border border-white"></div>
                  Kalkulasjoner
                </Label>
              </div>
            </div>

            {/* Map Container */}
            <div className="relative">
              <div 
                ref={mapContainer}
                className="w-full h-[500px] rounded-lg border overflow-hidden bg-muted"
              />
              
              {loading && (
                <div className="absolute inset-0 bg-muted/50 flex items-center justify-center rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Laster kart...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Map Info */}
            <div className="text-sm text-muted-foreground">
              <p>
                Kartdata fra OpenStreetMap. 
                {markers.current.length > 0 && ` Viser ${markers.current.length} eiendom${markers.current.length !== 1 ? 'mer' : ''}.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RentalMap;