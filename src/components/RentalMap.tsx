import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOptimizedPropertyData } from '@/hooks/useOptimizedPropertyData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// Stable map reference outside component to prevent re-initialization
let mapInstance: any = null;
let mapboxgl: any = null;
let isMapboxLoaded = false;

const RentalMap = () => {
  const { user } = useAuth();
  const { properties, calculationProperties, loading: dataLoading } = useOptimizedPropertyData();
  const { toast } = useToast();
  
  // Stable refs
  const mapContainer = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const isInitializedRef = useRef(false);
  
  // Stable state with refs to prevent unnecessary re-renders
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  
  // Layer toggles with localStorage persistence
  const [showMyProperties, setShowMyProperties] = useState(() => {
    return localStorage.getItem('rentalMap_showMyProperties') !== 'false';
  });
  const [showRentalProperties, setShowRentalProperties] = useState(() => {
    return localStorage.getItem('rentalMap_showRentalProperties') !== 'false';
  });
  const [showCalculationProperties, setShowCalculationProperties] = useState(() => {
    return localStorage.getItem('rentalMap_showCalculationProperties') !== 'false';
  });
  const [showMarketData, setShowMarketData] = useState(() => {
    return localStorage.getItem('rentalMap_showMarketData') !== 'false';
  });

  // Persist layer toggle states
  useEffect(() => {
    localStorage.setItem('rentalMap_showMyProperties', String(showMyProperties));
  }, [showMyProperties]);
  
  useEffect(() => {
    localStorage.setItem('rentalMap_showRentalProperties', String(showRentalProperties));
  }, [showRentalProperties]);
  
  useEffect(() => {
    localStorage.setItem('rentalMap_showCalculationProperties', String(showCalculationProperties));
  }, [showCalculationProperties]);
  
  useEffect(() => {
    localStorage.setItem('rentalMap_showMarketData', String(showMarketData));
  }, [showMarketData]);

  // Stable function to load Mapbox
  const loadMapbox = useCallback(async () => {
    if (isMapboxLoaded && mapboxgl) return mapboxgl;
    
    try {
      const mapboxModule = await import('mapbox-gl');
      mapboxgl = mapboxModule.default;
      isMapboxLoaded = true;
      return mapboxgl;
    } catch (error) {
      console.error('Failed to load Mapbox GL:', error);
      throw new Error('Could not load map library');
    }
  }, []);

  // Stable function to fetch token
  const fetchMapboxToken = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      
      if (error) {
        throw new Error(`Token service failed: ${error.message}`);
      }

      if (data?.success && data?.token) {
        return data.token;
      } else {
        throw new Error('Invalid token response');
      }
    } catch (error: any) {
      console.error('Token fetch failed:', error);
      throw error;
    }
  }, []);

  // Stable function to clear markers
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => {
      try {
        marker.remove();
      } catch (e) {
        // Ignore cleanup errors
      }
    });
    markersRef.current = [];
  }, []);

  // Stable function to create marker elements
  const createMarkerElement = useCallback((type: 'my-property' | 'rental' | 'calculation' | 'market', data?: any) => {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.cursor = 'pointer';
    
    const colors = {
      'my-property': '#3b82f6',
      'rental': '#10b981', 
      'calculation': '#f59e0b',
      'market': '#ef4444'
    };

    el.innerHTML = `
      <div style="
        width: 12px;
        height: 12px;
        background: ${colors[type]};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `;

    return el;
  }, []);

  // Stable function to add markers
  const addMarkersToMap = useCallback(() => {
    if (!mapInstance || !mapboxgl || !mapInstance.isStyleLoaded()) {
      return;
    }

    clearMarkers();

    const addedMarkers: any[] = [];

    // Add property markers
    if (showMyProperties && properties) {
      properties.forEach(property => {
        if (property.coordinates && property.coordinates.length === 2) {
          const el = createMarkerElement('my-property', property);
          
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <h3 class="font-semibold">${property.address}</h3>
              <p class="text-sm">Type: ${property.property_type || 'Ikke spesifisert'}</p>
              ${property.monthly_rent ? `<p class="text-sm">Månedlig leie: ${property.monthly_rent} NOK</p>` : ''}
            </div>
          `);
          
          const marker = new mapboxgl.Marker(el)
            .setLngLat([property.coordinates[0], property.coordinates[1]])
            .setPopup(popup)
            .addTo(mapInstance);
            
          addedMarkers.push(marker);
        }
      });
    }

    // Add calculation markers
    if (showCalculationProperties && calculationProperties) {
      calculationProperties.forEach(calc => {
        if (calc.coordinates && calc.coordinates.length === 2) {
          const el = createMarkerElement('calculation', calc);
          
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <h3 class="font-semibold">${calc.property_address}</h3>
              <p class="text-sm">Kalkyle: ${calc.calculation_data?.calculation_name || 'Uten navn'}</p>
              <p class="text-sm">Finn-kode: ${calc.finn_code}</p>
            </div>
          `);
          
          const marker = new mapboxgl.Marker(el)
            .setLngLat([calc.coordinates[0], calc.coordinates[1]])
            .setPopup(popup)
            .addTo(mapInstance);
            
          addedMarkers.push(marker);
        }
      });
    }

    markersRef.current = addedMarkers;

    // Auto-fit bounds if we have markers
    if (addedMarkers.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      addedMarkers.forEach(marker => bounds.extend(marker.getLngLat()));
      
      setTimeout(() => {
        try {
          if (addedMarkers.length === 1) {
            const markerLngLat = addedMarkers[0].getLngLat();
            mapInstance?.flyTo({
              center: [markerLngLat.lng, markerLngLat.lat],
              zoom: 12,
              duration: 1500
            });
          } else {
            mapInstance?.fitBounds(bounds, {
              padding: 50,
              duration: 1500,
              maxZoom: 12
            });
          }
        } catch (error) {
          // Ignore bounds errors
          console.log('Bounds calculation skipped:', error);
        }
      }, 100);
    }
  }, [showMyProperties, showCalculationProperties, properties, calculationProperties, clearMarkers, createMarkerElement]);

  // Initialize everything once
  useEffect(() => {
    if (!user || isInitializedRef.current) return;

    const initialize = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load Mapbox and token in parallel
        const [mapboxModule, token] = await Promise.all([
          loadMapbox(),
          fetchMapboxToken()
        ]);

        setMapboxToken(token);

        // Wait for container
        await new Promise(resolve => {
          const checkContainer = () => {
            if (mapContainer.current) {
              resolve(true);
            } else {
              setTimeout(checkContainer, 10);
            }
          };
          checkContainer();
        });

        // Initialize map once
        if (!mapInstance && mapContainer.current) {
          mapboxModule.accessToken = token;
          
          mapInstance = new mapboxModule.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [10.7522, 59.9139], // Oslo
            zoom: 6,
            attributionControl: false,
            preserveDrawingBuffer: true,
            antialias: true,
            failIfMajorPerformanceCaveat: false,
            trackResize: true
          });

          mapInstance.addControl(new mapboxModule.NavigationControl(), 'top-right');

          mapInstance.on('load', () => {
            console.log('Map loaded successfully');
            setMapReady(true);
            setLoading(false);
          });

          mapInstance.on('error', (e: any) => {
            console.error('Map error:', e);
            setError('Kartfeil: ' + (e.error?.message || e.message || 'Ukjent feil'));
            setLoading(false);
          });

          isInitializedRef.current = true;
        }
      } catch (error: any) {
        console.error('Initialization failed:', error);
        setError('Kunne ikke laste kart: ' + error.message);
        setLoading(false);
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      if (mapInstance) {
        clearMarkers();
        try {
          mapInstance.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
        mapInstance = null;
        isInitializedRef.current = false;
        setMapReady(false);
      }
    };
  }, [user, loadMapbox, fetchMapboxToken, clearMarkers]);

  // Update markers when data or toggles change
  useEffect(() => {
    if (mapReady && !loading && !dataLoading) {
      const timeoutId = setTimeout(addMarkersToMap, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [mapReady, loading, dataLoading, addMarkersToMap]);

  // Stable toggle handlers
  const handleMyPropertiesToggle = useCallback((checked: boolean) => {
    setShowMyProperties(checked);
  }, []);

  const handleRentalPropertiesToggle = useCallback((checked: boolean) => {
    setShowRentalProperties(checked);
  }, []);

  const handleCalculationPropertiesToggle = useCallback((checked: boolean) => {
    setShowCalculationProperties(checked);
  }, []);

  const handleMarketDataToggle = useCallback((checked: boolean) => {
    setShowMarketData(checked);
  }, []);

  // Stable retry handler
  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    setMapReady(false);
    isInitializedRef.current = false;
    
    if (mapInstance) {
      clearMarkers();
      try {
        mapInstance.remove();
      } catch (e) {
        // Ignore
      }
      mapInstance = null;
    }
    
    // Force re-initialization
    setTimeout(() => {
      isInitializedRef.current = false;
    }, 100);
  }, [clearMarkers]);

  // Don't render anything if no user
  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">Du må være logget inn for å se kartet.</p>
          <Button asChild>
            <a href="/auth">Logg inn</a>
          </Button>
        </CardContent>
      </Card>
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
          {/* Layer Controls */}
          <Card className="p-4 bg-muted/50">
            <h4 className="font-medium mb-3">Kartlag</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="my-properties" 
                  checked={showMyProperties} 
                  onCheckedChange={handleMyPropertiesToggle}
                />
                <Label htmlFor="my-properties" className="text-sm flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  Mine eiendommer
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="rental-properties" 
                  checked={showRentalProperties} 
                  onCheckedChange={handleRentalPropertiesToggle}
                />
                <Label htmlFor="rental-properties" className="text-sm flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  Utleie-enheter
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="calculation-properties" 
                  checked={showCalculationProperties} 
                  onCheckedChange={handleCalculationPropertiesToggle}
                />
                <Label htmlFor="calculation-properties" className="text-sm flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  Kalkulasjoner
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="market-data" 
                  checked={showMarketData} 
                  onCheckedChange={handleMarketDataToggle}
                />
                <Label htmlFor="market-data" className="text-sm flex items-center gap-1">
                  <div className="w-3 h-3 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"></div>
                  Markedsdata
                </Label>
              </div>
            </div>
          </Card>

          {/* Map Container */}
          {error ? (
            <div className="flex items-center justify-center h-96 bg-muted/50 rounded-lg">
              <div className="text-center">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <p className="text-red-500 font-medium mb-2">Kartfeil</p>
                <p className="text-muted-foreground text-sm mb-4">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRetry}
                >
                  Prøv igjen
                </Button>
              </div>
            </div>
          ) : loading || dataLoading ? (
            <div className="flex items-center justify-center h-96 bg-muted/50 rounded-lg">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">
                  {loading ? 'Laster inn kart...' : 'Henter eiendommer...'}
                </p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div 
                ref={mapContainer} 
                className="w-full h-96 rounded-lg border bg-muted/50"
                style={{ minHeight: '400px' }}
              />
            </div>
          )}

          {/* Map Legend */}
          {mapReady && !loading && !error && (
            <Card className="p-4 bg-muted/50">
              <h4 className="font-medium mb-3">Forklaring</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Mine eiendommer</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Utleie-enheter</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Kalkulasjoner</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"></div>
                  <span>Markedsdata</span>
                </div>
              </div>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {mapReady && !loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Totalt eiendommer</p>
                  <p className="text-2xl font-bold">{(properties?.length || 0) + (calculationProperties?.length || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Mine eiendommer</p>
                  <p className="text-2xl font-bold">{properties?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Kalkulasjoner</p>
                  <p className="text-2xl font-bold">{calculationProperties?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RentalMap;