import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [mapboxgl, setMapboxgl] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastTokenFetch, setLastTokenFetch] = useState<number>(0);

  // Prevent error loops - simple flag
  const [errorShown, setErrorShown] = useState(false);

  // Layer toggles with localStorage persistence - RESET TO ENSURE THEY'RE ON
  const [showMyProperties, setShowMyProperties] = useState(() => {
    // Reset localStorage for debugging
    localStorage.removeItem('rentalMap_showMyProperties');
    return true; // Force to true
  });
  const [showRentalProperties, setShowRentalProperties] = useState(() => {
    // Reset localStorage for debugging  
    localStorage.removeItem('rentalMap_showRentalProperties');
    return true; // Force to true
  });
  const [showCalculationProperties, setShowCalculationProperties] = useState(() => {
    localStorage.removeItem('rentalMap_showCalculationProperties');
    return true; // Force to true
  });
  const [showMarketData, setShowMarketData] = useState(() => {
    localStorage.removeItem('rentalMap_showMarketData');
    return true; // Force to true
  });

  // Get data
  const { properties, calculationProperties, loading: dataLoading } = useOptimizedPropertyData();

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

  // Load Mapbox GL JS dynamically
  useEffect(() => {
    const loadMapbox = async () => {
      try {
        const mapboxModule = await import('mapbox-gl');
        setMapboxgl(mapboxModule.default);
        console.log('✅ Mapbox GL loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load Mapbox GL:', error);
        if (!errorShown) {
          setError('Could not load map library');
          setErrorShown(true);
        }
      }
    };
    loadMapbox();
  }, [errorShown]);

  // Fetch Mapbox token with enhanced error handling
  const fetchMapboxToken = async (forceRefresh = false) => {
    const now = Date.now();
    const tokenAge = now - lastTokenFetch;
    const TOKEN_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
    
    // Use cached token if it's fresh and not forcing refresh
    if (mapboxToken && tokenAge < TOKEN_CACHE_DURATION && !forceRefresh) {
      console.log('🔄 Using cached Mapbox token (age:', Math.round(tokenAge / 60000), 'minutes)');
      return mapboxToken;
    }

    try {
      console.log('🔑 Fetching fresh Mapbox token from edge function...');
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      
      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(`Edge function failed: ${error.message || 'Unknown error'}`);
      }

      if (data?.success && data?.token && data.token.startsWith('pk.')) {
        console.log('✅ Valid Mapbox token received');
        console.log('Token prefix:', data.tokenPrefix);
        
        setMapboxToken(data.token);
        setLastTokenFetch(now);
        setRetryCount(0);
        return data.token;
      } else {
        console.error('❌ Invalid response from edge function:', data);
        throw new Error('Invalid response format from token service');
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch token:', error);
      throw error;
    }
  };

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!user || !mapboxToken) return;
    
    const TOKEN_REFRESH_INTERVAL = 80 * 60 * 1000; // 80 minutes
    const refreshTimer = setTimeout(() => {
      console.log('🔄 Auto-refreshing Mapbox token...');
      fetchMapboxToken(true).catch(console.error);
    }, TOKEN_REFRESH_INTERVAL);

    return () => clearTimeout(refreshTimer);
  }, [mapboxToken, user]);

  // Initial token fetch with better error handling
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    const initializeToken = async () => {
      try {
        await fetchMapboxToken();
      } catch (error: any) {
        console.error('Token fetch failed:', error);
        if (!errorShown) {
          setError(`Kunne ikke hente Mapbox token: ${error.message}`);
          setErrorShown(true);
        }
      } finally {
        setLoading(false);
      }
    };

    if (!mapboxToken) {
      initializeToken();
    } else {
      setLoading(false);
    }
  }, [user, mapboxToken, errorShown]);

  // Clear all markers
  const clearMarkers = () => {
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
  };

  // Create marker element with specific styling - FIXED hover issue
  const createMarkerElement = (type: 'my-property' | 'rental' | 'calculation' | 'market', data?: any) => {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    
    let backgroundColor = '#3b82f6'; // Default blue
    let borderColor = 'white';
    
    switch (type) {
      case 'my-property':
        backgroundColor = '#3b82f6'; // Blue
        break;
      case 'rental':
        backgroundColor = '#10b981'; // Green
        break;
      case 'calculation':
        backgroundColor = '#f59e0b'; // Amber/Yellow
        break;
      case 'market':
        backgroundColor = '#ef4444'; // Red
        break;
    }
    
    // FIXED: Removed problematic hover effects that caused jumping
    el.style.cssText = `
      width: 12px;
      height: 12px;
      background: ${backgroundColor};
      border: 2px solid ${borderColor};
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;

    return el;
  };

  // Add markers to map based on current layer visibility
  const addMarkersToMap = () => {
    if (!map.current || !mapboxgl || !map.current.isStyleLoaded()) {
      console.log('⚠️ Map not ready for markers');
      return;
    }

    console.log('🎯 Adding markers to map...');
    console.log('🔍 Available data:', {
      properties: properties?.length || 0,
      calculationProperties: calculationProperties?.length || 0,
      showMyProperties,
      showCalculationProperties
    });
    clearMarkers();

    let addedMarkers: any[] = [];
    let primaryResidenceMarker: any = null;

    // Add property markers if enabled
    if (showMyProperties && properties && properties.length > 0) {
      console.log(`📍 Adding ${properties.length} property markers`);
      properties.forEach((property) => {
        if (property.coordinates && property.coordinates.length === 2) {
          const el = createMarkerElement('my-property', property);
          
          // Create popup with property info
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1f2937;">${property.address}</h3>
              <p style="margin: 4px 0; font-size: 12px; color: #6b7280;">Type: ${property.property_type || 'Ikke spesifisert'}</p>
              ${property.monthly_rent ? `<p style="margin: 4px 0; font-size: 12px; color: #6b7280;">Månedlig leie: ${formatNumberWithSpaces(property.monthly_rent)} NOK</p>` : ''}
              ${property.current_value ? `<p style="margin: 4px 0; font-size: 12px; color: #6b7280;">Verdi: ${formatNumberWithSpaces(property.current_value)} NOK</p>` : ''}
              ${property.primary_residence ? '<p style="margin: 4px 0; font-size: 12px; color: #059669; font-weight: 500;">🏠 Primærbolig</p>' : ''}
            </div>
          `);
          
          const marker = new mapboxgl.Marker(el)
            .setLngLat([property.coordinates[0], property.coordinates[1]])
            .setPopup(popup)
            .addTo(map.current);
            
          addedMarkers.push(marker);
          
          // Track primary residence for special centering
          if (property.primary_residence) {
            primaryResidenceMarker = marker;
          }
        }
      });
    }

    // Add calculation markers if enabled - DEBUG this section
    if (showCalculationProperties && calculationProperties && calculationProperties.length > 0) {
      console.log(`🧮 Adding ${calculationProperties.length} calculation markers`);
      console.log('🔍 First calculation sample:', calculationProperties[0]);
      calculationProperties.forEach((calc, index) => {
        console.log(`🔍 Processing calculation ${index}:`, {
          address: calc.property_address,
          hasCoordinates: !!calc.coordinates,
          coordinates: calc.coordinates
        });
        
        if (calc.coordinates && calc.coordinates.length === 2) {
          const el = createMarkerElement('calculation', calc);
          
          // Create popup with calculation info
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1f2937;">${calc.property_address}</h3>
              <p style="margin: 4px 0; font-size: 12px; color: #6b7280;">Kalkyle: ${calc.calculation_data?.calculation_name || 'Uten navn'}</p>
              <p style="margin: 4px 0; font-size: 12px; color: #6b7280;">Finn-kode: ${calc.finn_code}</p>
              ${calc.results_data?.totalPrice ? `<p style="margin: 4px 0; font-size: 12px; color: #6b7280;">Pris: ${formatNumberWithSpaces(calc.results_data.totalPrice)} NOK</p>` : ''}
            </div>
          `);
          
          const marker = new mapboxgl.Marker(el)
            .setLngLat([calc.coordinates[0], calc.coordinates[1]])
            .setPopup(popup)
            .addTo(map.current);
            
          addedMarkers.push(marker);
          console.log(`✅ Added calculation marker at [${calc.coordinates[0]}, ${calc.coordinates[1]}]`);
        } else {
          console.log(`❌ Calculation ${index} missing coordinates:`, calc);
        }
      });
    }

    // Update markers ref
    markers.current = addedMarkers;

    // Auto-fit bounds for ALL markers (calculations included) - FIXED
    if (addedMarkers.length > 0) {
      console.log(`🎯 Centering map on ${addedMarkers.length} markers`);
      setTimeout(() => {
        try {
          if (primaryResidenceMarker) {
            // Priority: Center on primary residence
            const lngLat = primaryResidenceMarker.getLngLat();
            console.log('📍 Centering on primary residence:', lngLat);
            map.current?.flyTo({
              center: [lngLat.lng, lngLat.lat],
              zoom: 12,
              duration: 2000
            });
          } else if (addedMarkers.length === 1) {
            // Single marker: Center on it (could be calculation or property)
            const lngLat = addedMarkers[0].getLngLat();
            console.log('📍 Centering on single marker:', lngLat);
            map.current?.flyTo({
              center: [lngLat.lng, lngLat.lat],
              zoom: 12,
              duration: 1500
            });
          } else {
            // Multiple markers: Fit bounds to show all
            const bounds = new mapboxgl.LngLatBounds();
            addedMarkers.forEach(marker => {
              bounds.extend(marker.getLngLat());
            });
            
            console.log('📍 Fitting bounds for multiple markers');
            map.current?.fitBounds(bounds, {
              padding: 100,
              duration: 1500,
              maxZoom: 14
            });
          }
        } catch (boundsError) {
          console.log('⚠️ Bounds calculation failed, using fallback center:', boundsError);
          // Fallback to center of Norway/Oslo
          map.current?.flyTo({
            center: [10.7522, 59.9139], 
            zoom: 6,
            duration: 1000
          });
        }
      }, 800); // Increased delay to ensure map is ready
    } else {
      // No markers found - center on Norway
      console.log('📍 No markers found, centering on Norway');
      setTimeout(() => {
        map.current?.flyTo({
          center: [10.7522, 59.9139],
          zoom: 6,
          duration: 1000
        });
      }, 1000);
    }

    console.log(`✅ Added ${addedMarkers.length} markers total`);
  };

  // Initialize map - STABLE version with minimal error handling
  useEffect(() => {
    const initMap = () => {
      console.log('🗺️ Map initialization check:', {
        hasToken: !!mapboxToken,
        hasMapboxgl: !!mapboxgl,
        hasContainer: !!mapContainer.current,
        hasExistingMap: !!map.current,
        loading,
        dataLoading,
        user: !!user,
        error
      });

      // Only initialize if we have all requirements and no existing map
      if (!mapboxToken || !mapboxgl || !mapContainer.current || map.current || loading || dataLoading || !user || error) {
        console.log('❌ Map initialization requirements not met');
        return;
      }

      try {
        console.log('🚀 Initializing map...');
        mapboxgl.accessToken = mapboxToken;

        // Check if we're in an iframe
        const isInIframe = window.self !== window.top;
        console.log('🖼️ Running in iframe:', isInIframe);
        
        // Check for WebGL support
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
          console.error('❌ WebGL not supported');
          if (!errorShown) {
            setError('WebGL støttes ikke av din nettleser eller er deaktivert');
            setErrorShown(true);
          }
          return;
        }
        
        console.log('✅ WebGL support detected');
        canvas.remove();

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [10.7522, 59.9139], // Oslo
          zoom: 6,
          attributionControl: false,
          projection: 'mercator',
          preserveDrawingBuffer: isInIframe,
          antialias: !isInIframe,
          failIfMajorPerformanceCaveat: false,
          trackResize: true,
          maxTileCacheSize: isInIframe ? 50 : 100,
          refreshExpiredTiles: !isInIframe,
        });

        console.log('✅ Map instance created');

        map.current.addControl(
          new mapboxgl.NavigationControl(),
          'top-right'
        );

        map.current.on('load', () => {
          console.log('✅ Map loaded successfully');
          setTimeout(() => {
            if (map.current && map.current.isStyleLoaded()) {
              console.log('✅ Map style loaded, adding markers');
              addMarkersToMap();
            }
          }, 500);
        });

        // SIMPLIFIED error handling to prevent loops
        map.current.on('error', (e) => {
          const errorMessage = e.error?.message || e.message || 'Ukjent feil';
          console.error('❌ Map error:', errorMessage);
          
          // Only set error once to prevent loops
          if (!errorShown) {
            setError(`Kartfeil: ${errorMessage}`);
            setErrorShown(true);
          }
        });

      } catch (error) {
        console.error('❌ Map initialization failed:', error);
        if (!errorShown) {
          setError(`Kunne ikke initialisere kartet: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
          setErrorShown(true);
        }
      }
    };

    // Small timeout to ensure DOM is ready
    const timeoutId = setTimeout(initMap, 100);
    return () => clearTimeout(timeoutId);
  }, [mapboxToken, mapboxgl, loading, dataLoading, user, error, errorShown]);

  // Cleanup map only when component unmounts
  useEffect(() => {
    return () => {
      clearMarkers();
      if (map.current) {
        try {
          map.current.remove();
        } catch (error) {
          console.log('Map cleanup error (safe to ignore):', error);
        }
        map.current = null;
      }
    };
  }, []);

  // Update markers when data or layer toggles change - THROTTLED
  useEffect(() => {
    if (!map.current || !mapboxgl || !mapboxToken || loading || dataLoading) {
      return;
    }

    const updateMarkers = () => {
      if (map.current && map.current.isStyleLoaded() && mapboxgl) {
        addMarkersToMap();
      } else {
        setTimeout(updateMarkers, 200);
      }
    };

    // Throttle marker updates to prevent excessive re-rendering
    const timeoutId = setTimeout(updateMarkers, 300);
    
    return () => clearTimeout(timeoutId);
  }, [properties, calculationProperties, showMyProperties, showRentalProperties, showCalculationProperties, showMarketData, mapboxToken, loading, dataLoading]);

  // Layer toggle handlers
  const handleMyPropertiesToggle = (checked: boolean) => {
    setShowMyProperties(checked);
  };

  const handleRentalPropertiesToggle = (checked: boolean) => {
    setShowRentalProperties(checked);
  };

  const handleCalculationPropertiesToggle = (checked: boolean) => {
    setShowCalculationProperties(checked);
  };

  const handleMarketDataToggle = (checked: boolean) => {
    setShowMarketData(checked);
  };

  // Show message if user is not authenticated
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

          {loading || dataLoading ? (
            <div className="flex items-center justify-center h-96 bg-muted/50 rounded-lg">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">
                  {loading ? 'Laster inn kart...' : 'Henter eiendommer...'}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-96 bg-muted/50 rounded-lg">
              <div className="text-center">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <p className="text-red-500 font-medium mb-2">Kartfeil</p>
                <p className="text-muted-foreground text-sm mb-4">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setError(null);
                    setErrorShown(false);
                    setLoading(true);
                    setRetryCount(0);
                    // Force re-initialization
                    if (map.current) {
                      clearMarkers();
                      try {
                        map.current.remove();
                      } catch (e) {
                        // ignore
                      }
                      map.current = null;
                    }
                  }}
                >
                  Prøv igjen
                </Button>
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
          {!loading && !error && !dataLoading && (
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
      {!loading && !error && !dataLoading && (
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