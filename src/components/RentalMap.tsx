import React, { useEffect, useRef, useState } from 'react';
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
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Layer toggles
  const [showMyProperties, setShowMyProperties] = useState(true);
  const [showRentalProperties, setShowRentalProperties] = useState(true);
  const [showCalculationProperties, setShowCalculationProperties] = useState(true);
  const [showMarketData, setShowMarketData] = useState(true);

  // Get data
  const { properties, calculationProperties, loading: dataLoading } = useOptimizedPropertyData();

  const addDebug = (message: string) => {
    console.log(`🔧 [DEBUG] ${message}`);
    setDebugInfo(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Fetch Mapbox token
  const fetchMapboxToken = async () => {
    try {
      addDebug('Initierer Mapbox token henting...');
      
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      
      if (error) {
        throw new Error(`Edge function feil: ${error.message}`);
      }

      addDebug(`Token respons mottatt: ${JSON.stringify(data)}`);

      if (data?.success && data?.token && data.token.startsWith('pk.')) {
        addDebug(`Gyldig token mottatt: ${data.token.substring(0, 20)}...`);
        setMapboxToken(data.token);
        return data.token;
      } else {
        throw new Error(`Ugyldig token respons: ${JSON.stringify(data)}`);
      }
    } catch (error: any) {
      const errorMsg = `Token henting feilet: ${error.message}`;
      addDebug(errorMsg);
      setError(errorMsg);
      return null;
    }
  };

  // Clear markers
  const clearMarkers = () => {
    markers.current.forEach(marker => {
      try {
        marker?.remove();
      } catch (e) {
        addDebug(`Feil ved fjerning av markør: ${e}`);
      }
    });
    markers.current = [];
    addDebug(`Fjernet ${markers.current.length} markører`);
  };

  // Add markers to map
  const addMarkers = async () => {
    if (!map.current || loading || dataLoading) {
      addDebug(`Markører ikke klare: map=${!!map.current}, loading=${loading}, dataLoading=${dataLoading}`);
      return;
    }

    addDebug('Starter markør tilføyelse...');
    clearMarkers();

    let allMarkers: any[] = [];
    let bounds: any = null;

    try {
      const mapboxModule = await import('mapbox-gl');
      const mapboxgl = mapboxModule.default;
      bounds = new mapboxgl.LngLatBounds();
      addDebug('Mapbox GL importert OK');

      // Add property markers
      if (showMyProperties && properties && properties.length > 0) {
        addDebug(`Legger til ${properties.length} eiendom markører`);
        properties.forEach((property, index) => {
          if (property.coordinates && property.coordinates.length === 2) {
            try {
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
              addDebug(`Eiendom markør ${index + 1} lagt til på [${property.coordinates[0]}, ${property.coordinates[1]}]`);
            } catch (markerError) {
              addDebug(`Feil ved eiendom markør ${index + 1}: ${markerError}`);
            }
          }
        });
      }

      // Add calculation markers
      if (showCalculationProperties && calculationProperties && calculationProperties.length > 0) {
        addDebug(`Legger til ${calculationProperties.length} kalkyle markører`);
        calculationProperties.forEach((calc, index) => {
          if (calc.coordinates && calc.coordinates.length === 2) {
            try {
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
              addDebug(`Kalkyle markør ${index + 1} lagt til på [${calc.coordinates[0]}, ${calc.coordinates[1]}]`);
            } catch (markerError) {
              addDebug(`Feil ved kalkyle markør ${index + 1}: ${markerError}`);
            }
          }
        });
      }

      // Update markers ref
      markers.current = allMarkers;
      addDebug(`Totalt ${allMarkers.length} markører lagt til`);

      // Center map on markers
      if (allMarkers.length > 0) {
        if (allMarkers.length === 1) {
          const lngLat = allMarkers[0].getLngLat();
          map.current.setCenter([lngLat.lng, lngLat.lat]);
          map.current.setZoom(12);
          addDebug(`Sentrert på enkelt markør: [${lngLat.lng}, ${lngLat.lat}]`);
        } else {
          map.current.fitBounds(bounds, {
            padding: 50,
            maxZoom: 14
          });
          addDebug(`Tilpasset til bounds for ${allMarkers.length} markører`);
        }
      } else {
        map.current.setCenter([10.7522, 59.9139]);
        map.current.setZoom(6);
        addDebug('Ingen markører - bruker standard Oslo senter');
      }
    } catch (error) {
      const errorMsg = `Markør feil: ${error}`;
      addDebug(errorMsg);
      console.error(errorMsg, error);
    }
  };

  // Initialize map
  useEffect(() => {
    if (!user) {
      setLoading(false);
      addDebug('Ingen bruker - avslutter');
      return;
    }

    let mapboxgl: any = null;
    let mapInstance: any = null;

    const initializeMap = async () => {
      try {
        addDebug('Starter kart initialisering...');
        
        // Load Mapbox GL
        const mapboxModule = await import('mapbox-gl');
        mapboxgl = mapboxModule.default;
        addDebug('Mapbox GL modul lastet');

        // Get token
        const token = mapboxToken || await fetchMapboxToken();
        if (!token) {
          addDebug('Ingen token mottatt - avbryter');
          return;
        }

        // Set access token
        mapboxgl.accessToken = token;
        addDebug(`Mapbox token satt: ${token.substring(0, 20)}...`);

        // Create map
        if (mapContainer.current && !map.current) {
          addDebug('Oppretter kart instans...');
          
          try {
            mapInstance = new mapboxgl.Map({
              container: mapContainer.current,
              style: 'mapbox://styles/mapbox/streets-v11',
              center: [10.7522, 59.9139], // Oslo
              zoom: 6,
              attributionControl: false,
              preserveDrawingBuffer: true
            });

            map.current = mapInstance;
            addDebug('✅ Kart instans opprettet');
          } catch (mapError) {
            addDebug(`❌ Kart opprettelse feilet: ${mapError}`);
            throw mapError;
          }

          // Add navigation controls
          const navControl = new mapboxgl.NavigationControl();
          mapInstance.addControl(navControl, 'top-right');
          addDebug('Navigasjonskontroller lagt til');

          // Wait for map to load
          mapInstance.on('load', () => {
            addDebug('✅ Kart lastet ferdig');
            setLoading(false);
            setError(null);
            addMarkers();
          });

          // Force loading to finish after timeout
          setTimeout(() => {
            if (loading && mapInstance && mapInstance.loaded && mapInstance.loaded()) {
              addDebug('🕐 Tidsavbrudd - tvinger kart ferdig');
              setLoading(false);
              setError(null);
              addMarkers();
            } else if (loading) {
              addDebug('🕐 Tidsavbrudd - kart ikke lastet, fortsetter likevel');
              setLoading(false);
              addMarkers();
            }
          }, 5000);

          mapInstance.on('styledata', () => {
            addDebug('🎨 Kartsstil lastet');
          });

          mapInstance.on('sourcedataloading', (e: any) => {
            addDebug(`📡 Laster kartdata: ${e.sourceId}`);
          });

          mapInstance.on('sourcedata', (e: any) => {
            addDebug(`✅ Kartdata lastet: ${e.sourceId}`);
          });

          // Handle map errors
          mapInstance.on('error', (e: any) => {
            const errorDetails = {
              type: e.type,
              error: e.error ? {
                message: e.error.message,
                status: e.error.status,
                url: e.error.url
              } : 'Ukjent feil'
            };
            
            addDebug(`❌ Kartfeil: ${JSON.stringify(errorDetails)}`);
            
            // For 403 errors, ignore them as they are tile loading issues
            if (e.error && e.error.status === 403) {
              addDebug('🔧 403-feil ignorert (vanlig kartlastingsfeil)');
              return;
            }
            
            // Only set error for critical issues
            if (e.error && e.error.status === 401) {
              setError('Kartfeil: Ugyldig Mapbox token');
              setLoading(false);
            } else if (e.error && e.error.message && e.error.message.includes('network')) {
              setError('Kartfeil: Nettverksfeil - sjekk internettforbindelsen');
              setLoading(false);
            }
          });

          // Force map refresh
          setTimeout(() => {
            if (mapInstance && mapInstance.isStyleLoaded && mapInstance.isStyleLoaded()) {
              mapInstance.resize();
              addDebug('Kart størrelse justert');
            }
          }, 1000);

        } else {
          addDebug('Kart container ikke tilgjengelig eller kart allerede opprettet');
        }
      } catch (error: any) {
        const errorMsg = `Kart initialisering feilet: ${error.message}`;
        addDebug(errorMsg);
        setError(errorMsg);
        setLoading(false);
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (mapInstance) {
        addDebug('Rydder opp kart instans');
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
      addDebug('Data eller innstillinger endret - oppdaterer markører');
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

  const resetMap = () => {
    addDebug('Tilbakestiller kart...');
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
      <Card className="h-[600px]">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold">Kartfeil</h3>
          </div>
          <p className="text-red-600">{error}</p>
          
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-sm">Debug informasjon:</h4>
            <div className="text-xs font-mono space-y-1 max-h-40 overflow-y-auto">
              {debugInfo.map((info, i) => (
                <div key={i} className="text-gray-600">{info}</div>
              ))}
            </div>
          </div>
          
          <Button onClick={resetMap}>
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
            {/* Debug Panel */}
            {debugInfo.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-2">System status:</h4>
                <div className="text-xs font-mono space-y-1 max-h-32 overflow-y-auto">
                  {debugInfo.slice(-5).map((info, i) => (
                    <div key={i} className="text-blue-700">{info}</div>
                  ))}
                </div>
              </div>
            )}

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