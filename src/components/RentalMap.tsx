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
    // Reset localStorage for debugging
    localStorage.removeItem('rentalMap_showCalculationProperties'); 
    return true; // Force to true
  });
  const [showMarketData, setShowMarketData] = useState(() => {
    // Reset localStorage for debugging
    localStorage.removeItem('rentalMap_showMarketData');
    return false; // Keep false for now
  });

  const { properties, calculationProperties, loading: dataLoading } = useOptimizedPropertyData();

  // Debug properties data
  useEffect(() => {
    if (properties.length > 0) {
      console.log('🏠 Properties data for map:', properties.map(p => ({
        address: p.address,
        show_in_rental: p.show_in_rental,
        monthly_rent: p.monthly_rent,
        hasCoordinates: !!p.coordinates
      })));
      
      const rentalProperties = properties.filter(p => p.show_in_rental === true);
      const myProperties = properties.filter(p => p.show_in_rental !== true);
      
      console.log('🟢 Rental properties (show_in_rental=true):', rentalProperties.length, rentalProperties.map(p => p.address));
      console.log('🔵 My properties (show_in_rental≠true):', myProperties.length, myProperties.map(p => p.address));
    }
  }, [properties]);

  // Save layer settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('rentalMap_showMyProperties', JSON.stringify(showMyProperties));
  }, [showMyProperties]);

  useEffect(() => {
    localStorage.setItem('rentalMap_showRentalProperties', JSON.stringify(showRentalProperties));
  }, [showRentalProperties]);

  useEffect(() => {
    localStorage.setItem('rentalMap_showCalculationProperties', JSON.stringify(showCalculationProperties));
  }, [showCalculationProperties]);

  useEffect(() => {
    localStorage.setItem('rentalMap_showMarketData', JSON.stringify(showMarketData));
  }, [showMarketData]);

  // Load Mapbox GL
  useEffect(() => {
    const loadMapbox = async () => {
      try {
        console.log('🗺️ Loading Mapbox GL...');
        const mapboxModule = await import('mapbox-gl');
        await import('mapbox-gl/dist/mapbox-gl.css');
        console.log('✅ Mapbox GL loaded successfully');
        setMapboxgl(mapboxModule.default);
      } catch (error) {
        console.error('❌ Failed to load Mapbox GL:', error);
        setError('Kunne ikke laste Mapbox GL biblioteket');
        toast({
          title: "Kartfeil",
          description: "Kunne ikke laste Mapbox GL biblioteket",
          variant: "destructive",
        });
      }
    };
    loadMapbox();
  }, [toast]);

  // Fetch Mapbox token with retry logic and caching
  const fetchMapboxToken = async (forceRefresh = false) => {
    const now = Date.now();
    const tokenAge = now - lastTokenFetch;
    const TOKEN_CACHE_DURATION = 90 * 60 * 1000; // 90 minutes
    
    // Use cached token if it's fresh and not forcing refresh
    if (mapboxToken && tokenAge < TOKEN_CACHE_DURATION && !forceRefresh) {
      return mapboxToken;
    }

    try {
      console.log('🔑 Fetching Mapbox token...');
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      
      if (error) {
        console.error('❌ Token fetch error:', error);
        throw error;
      }

      if (data?.token) {
        console.log('✅ Mapbox token received');
        setMapboxToken(data.token);
        setLastTokenFetch(now);
        setRetryCount(0);
        return data.token;
      } else {
        console.error('❌ No token received from server');
        throw new Error('Ingen token mottatt');
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

  // Initial token fetch
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    const initializeToken = async () => {
      try {
        await fetchMapboxToken();
      } catch (error: any) {
        setError(`Kunne ikke hente Mapbox token: ${error.message}`);
        toast({
          title: "Kartfeil", 
          description: `Kunne ikke laste kartet. Kontroller Mapbox token konfigurasjonen.`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (!mapboxToken) {
      initializeToken();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Clear all markers
  const clearMarkers = () => {
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
  };

  // Create marker element with specific styling
  const createMarkerElement = (type: 'my-property' | 'rental' | 'calculation' | 'market', data?: any) => {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    
    switch (type) {
      case 'my-property':
        el.style.backgroundColor = '#3b82f6'; // Blue
        el.style.border = '3px solid white';
        el.innerHTML = '<div style="color: white; font-size: 10px; text-align: center; line-height: 14px;">🏠</div>';
        break;
      case 'rental':
        el.style.backgroundColor = '#22c55e'; // Green
        el.style.border = '3px solid white';
        el.innerHTML = '<div style="color: white; font-size: 10px; text-align: center; line-height: 14px;">🏠</div>';
        break;
      case 'calculation':
        el.style.backgroundColor = '#ffffff'; // White
        el.style.border = '3px solid #6b7280';
        el.innerHTML = '<div style="color: #6b7280; font-size: 10px; text-align: center; line-height: 14px;">📊</div>';
        break;
      case 'market':
        const yield_ = data?.yield || 0;
        el.style.backgroundColor = yield_ > 5.0 ? '#22c55e' : yield_ > 4.5 ? '#f59e0b' : '#ef4444';
        el.style.border = '2px solid white';
        break;
    }
    
    el.style.width = '24px';
    el.style.height = '24px';
    el.style.borderRadius = '50%';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    el.style.cursor = 'pointer';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.overflow = 'hidden';
    el.style.position = 'absolute';
    el.style.transformOrigin = 'center center';
    el.style.transform = 'translate(-50%, -50%)';
    el.style.pointerEvents = 'auto';
    
    return el;
  };

  // Add markers to map with dynamic zoom behavior
  const addMarkersToMap = () => {
    if (!map.current || !mapboxgl) {
      return;
    }
    
    clearMarkers();
    console.log('🗺️ Adding markers. States:', {
      showMyProperties,
      showRentalProperties, 
      showCalculationProperties,
      showMarketData,
      totalProperties: properties.length
    });

    let shouldZoomToPrimary = false;
    let primaryProperty = null;

    // Add user's properties that are NOT for rent (blue pins)
    if (showMyProperties && properties.length > 0) {
      const myProps = properties.filter(p => p.show_in_rental !== true);
      console.log('🔵 Adding my property markers for:', myProps.length, 'properties');
      
      // Find primary residence for zoom target
      primaryProperty = myProps.find(p => p.primary_residence === true);
      if (primaryProperty && primaryProperty.coordinates) {
        shouldZoomToPrimary = true;
        console.log('🏠 Found primary residence:', primaryProperty.address);
      }
      
      myProps.forEach((property) => {
        if (!property.coordinates || !Array.isArray(property.coordinates) || property.coordinates.length !== 2) {
          console.log('❌ My property missing coordinates:', property.address);
          return;
        }
        
        console.log('✅ Adding blue marker for:', property.address, 'at', property.coordinates);
        const el = createMarkerElement('my-property');
        
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div class="font-medium text-sm p-2">
            <h3 class="font-bold text-blue-600">Min eiendom ${property.primary_residence ? '🏠 (Primærbolig)' : ''}</h3>
            <p class="font-semibold">${property.address}</p>
            ${property.city ? `<p class="text-gray-600">${property.city}</p>` : ''}
            <div class="mt-2 space-y-1">
              <p><strong>Type:</strong> ${property.property_type || 'Ikke oppgitt'}</p>
              ${property.current_value ? `<p><strong>Verdi:</strong> ${formatNumberWithSpaces(property.current_value)} kr</p>` : ''}
              ${property.monthly_rent ? `<p><strong>Månedlig leie:</strong> ${formatNumberWithSpaces(property.monthly_rent)} kr</p>` : ''}
            </div>
          </div>
        `);

        const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'center'
        })
          .setLngLat([property.coordinates[0], property.coordinates[1]])
          .setPopup(popup)
          .addTo(map.current!);
          
        markers.current.push(marker);
      });
    }

    // Add rental properties that are marked for rent (green pins) 
    if (showRentalProperties && properties.length > 0) {
      const rentalProps = properties.filter(p => p.show_in_rental === true);
      console.log('🟢 Adding rental markers for:', rentalProps.length, 'properties');
      
      rentalProps.forEach((property) => {
        if (!property.coordinates || !Array.isArray(property.coordinates) || property.coordinates.length !== 2) {
          console.log('❌ Rental property missing coordinates:', property.address);
          return;
        }
        
        console.log('✅ Adding green marker for:', property.address, 'at', property.coordinates);
        const el = createMarkerElement('rental');
        
        const yield_ = property.monthly_rent && property.current_value 
          ? (property.monthly_rent * 12 / property.current_value * 100) 
          : 0;
        
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div class="font-medium text-sm p-2">
            <h3 class="font-bold text-green-600">Utleie-eiendom</h3>
            <p class="font-semibold">${property.address}</p>
            ${property.city ? `<p class="text-gray-600">${property.city}</p>` : ''}
            <div class="mt-2 space-y-1">
              <p><strong>Status:</strong> På utleie</p>
              ${property.monthly_rent ? `<p><strong>Månedlig leie:</strong> ${formatNumberWithSpaces(property.monthly_rent)} kr</p>` : '<p><strong>Status:</strong> Tilgjengelig for utleie</p>'}
              ${yield_ > 0 ? `<p><strong>Avkastning:</strong> <span class="font-semibold text-green-600">${yield_.toFixed(1)}%</span></p>` : ''}
            </div>
          </div>
        `);

        const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'center'
        })
          .setLngLat([property.coordinates[0], property.coordinates[1]])
          .setPopup(popup)
          .addTo(map.current!);
          
        markers.current.push(marker);
      });
    }

    // Add calculation properties (white pins)
    if (showCalculationProperties && calculationProperties.length > 0) {
      calculationProperties.forEach((calc) => {
        if (!calc.coordinates || !Array.isArray(calc.coordinates) || calc.coordinates.length !== 2) {
          return;
        }
        
        const el = createMarkerElement('calculation');
        
        const calcData = calc.calculation_data || {};
        const resultsData = calc.results_data || {};
        
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div class="font-medium text-sm p-2">
            <h3 class="font-bold text-gray-600">Kalkulasjon</h3>
            <p class="font-semibold">${calc.property_address}</p>
            ${calc.finn_code ? `<p class="text-blue-600">Finn: ${calc.finn_code}</p>` : ''}
            <div class="mt-2 space-y-1">
              ${resultsData.totalPrice ? `<p><strong>Pris:</strong> ${formatNumberWithSpaces(resultsData.totalPrice)} kr</p>` : ''}
              ${resultsData.monthlyRent ? `<p><strong>Leie:</strong> ${formatNumberWithSpaces(resultsData.monthlyRent)} kr</p>` : ''}
              ${resultsData.yield ? `<p><strong>Avkastning:</strong> <span class="font-semibold">${resultsData.yield.toFixed(1)}%</span></p>` : ''}
            </div>
          </div>
        `);

        const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'center'
        })
          .setLngLat([calc.coordinates[0], calc.coordinates[1]])
          .setPopup(popup)
          .addTo(map.current!);
          
        markers.current.push(marker);
      });
    }

    // Add market data (colored pins based on yield)
    if (showMarketData) {
      const demoData = [
        { name: 'Oslo', coordinates: [10.7522, 59.9139], yield: 4.2, avgRent: 18500 },
        { name: 'Bergen', coordinates: [5.3221, 60.3913], yield: 5.1, avgRent: 14200 },
        { name: 'Trondheim', coordinates: [10.3951, 63.4305], yield: 5.8, avgRent: 12800 },
        { name: 'Stavanger', coordinates: [5.7331, 58.9700], yield: 4.7, avgRent: 15600 },
        { name: 'Drammen', coordinates: [10.2049, 59.7439], yield: 5.3, avgRent: 13400 },
      ];

      demoData.forEach((location) => {
        const el = createMarkerElement('market', location);
        
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div class="font-medium text-sm p-2">
            <h3 class="font-bold">${location.name}</h3>
            <p>Avkastning: <span class="font-semibold ${location.yield > 5.0 ? 'text-green-600' : location.yield > 4.5 ? 'text-yellow-600' : 'text-red-600'}">${location.yield}%</span></p>
            <p>Gj.snitt leie: ${location.avgRent.toLocaleString()} kr</p>
          </div>
        `);

        const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'center'
        })
          .setLngLat(location.coordinates as [number, number])
          .setPopup(popup)
          .addTo(map.current!);
          
        markers.current.push(marker);
      });
    }

    // Zoom to primary residence if available, otherwise zoom to first property or fit all markers
    if (shouldZoomToPrimary && primaryProperty && primaryProperty.coordinates) {
      console.log('🎯 Zooming to primary residence:', primaryProperty.address);
      map.current!.flyTo({
        center: [primaryProperty.coordinates[0], primaryProperty.coordinates[1]],
        zoom: 13,
        duration: 2000
      });
    } else if (markers.current.length > 0) {
      // Fit bounds to show all markers
      const bounds = new mapboxgl.LngLatBounds();
      markers.current.forEach(marker => {
        bounds.extend(marker.getLngLat());
      });
      
      if (markers.current.length === 1) {
        // Single marker, center on it
        const markerLngLat = markers.current[0].getLngLat();
        map.current!.flyTo({
          center: [markerLngLat.lng, markerLngLat.lat],
          zoom: 12,
          duration: 2000
        });
      } else {
        // Multiple markers, fit bounds
        map.current!.fitBounds(bounds, {
          padding: 50,
          duration: 2000,
          maxZoom: 12
        });
      }
    }
  };

  // Initialize map - only run once when requirements are met
  useEffect(() => {
    // Add a small delay to ensure DOM is ready
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

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [10.7522, 59.9139], // Oslo
          zoom: 6,
          attributionControl: false,
        });

        console.log('✅ Map instance created');

        map.current.addControl(
          new mapboxgl.NavigationControl(),
          'top-right'
        );

        map.current.on('load', () => {
          console.log('✅ Map loaded successfully');
          // Wait longer for map to be fully ready
          setTimeout(() => {
            if (map.current && map.current.isStyleLoaded()) {
              console.log('✅ Map style loaded, adding markers');
              addMarkersToMap();
            }
          }, 500);
        });

        map.current.on('error', (e) => {
          const errorMessage = e.error?.message || e.message || 'Ukjent feil';
          console.error('❌ Map error:', errorMessage);
          
          const isRecoverableError = errorMessage.includes('NetworkError') || 
                                   errorMessage.includes('timeout') ||
                                   errorMessage.includes('Failed to fetch') ||
                                   errorMessage.includes('StyleError') ||
                                   errorMessage.includes('RequestManager') ||
                                   errorMessage.includes('TileLoadError') ||
                                   errorMessage.includes('401') ||
                                   errorMessage.includes('Unauthorized');
          
          if (isRecoverableError && retryCount < 3) {
            console.log('🔄 Attempting to recover from map error...');
            setRetryCount(prev => prev + 1);
            
            // Try to refresh token and reinitialize
            setTimeout(async () => {
              try {
                await fetchMapboxToken(true);
                if (map.current) {
                  map.current.remove();
                  map.current = null;
                }
                // The map will reinitialize automatically due to useEffect dependencies
              } catch (error) {
                console.error('Failed to recover:', error);
              }
            }, 2000);
          } else if (!isRecoverableError) {
            setError(`Mapbox error: ${errorMessage}`);
            toast({
              title: "Kartfeil",
              description: `Mapbox feil: ${errorMessage}`,
              variant: "destructive",
            });
          }
        });

      } catch (error) {
        console.error('❌ Map initialization failed:', error);
        setError(`Map initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        toast({
          title: "Kartfeil",
          description: `Kunne ikke initialisere kartet: ${error instanceof Error ? error.message : 'Ukjent feil'}`,
          variant: "destructive",
        });
      }
    };

    // Use a small timeout to ensure DOM is ready
    const timeoutId = setTimeout(initMap, 100);
    return () => clearTimeout(timeoutId);
  }, [mapboxToken, mapboxgl, loading, dataLoading, user, error, toast]);

  // Cleanup map only when component unmounts
  useEffect(() => {
    return () => {
      clearMarkers();
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Handle dynamic zoom when toggles change
  const handleCategoryToggle = (category: string, isEnabled: boolean) => {
    if (!map.current) return;
    
    if (isEnabled) {
      // Zoom in when enabling a category
      setTimeout(() => {
        if (markers.current.length > 0) {
          const bounds = new mapboxgl.LngLatBounds();
          markers.current.forEach(marker => {
            bounds.extend(marker.getLngLat());
          });
          
          if (markers.current.length === 1) {
            const markerLngLat = markers.current[0].getLngLat();
            map.current!.flyTo({
              center: [markerLngLat.lng, markerLngLat.lat],
              zoom: 12,
              duration: 1500
            });
          } else {
            map.current!.fitBounds(bounds, {
              padding: 50,
              duration: 1500,
              maxZoom: 12
            });
          }
        }
      }, 100);
    } else {
      // Zoom out slightly when disabling a category
      const currentZoom = map.current.getZoom();
      map.current.flyTo({
        zoom: Math.max(currentZoom - 1, 6),
        duration: 1000
      });
    }
  };

  // Layer toggle handlers with dynamic zoom
  const handleMyPropertiesToggle = (checked: boolean) => {
    setShowMyProperties(checked);
    handleCategoryToggle('my-properties', checked);
  };

  const handleRentalPropertiesToggle = (checked: boolean) => {
    setShowRentalProperties(checked);
    handleCategoryToggle('rental-properties', checked);
  };

  const handleCalculationPropertiesToggle = (checked: boolean) => {
    setShowCalculationProperties(checked);
    handleCategoryToggle('calculation-properties', checked);
  };

  const handleMarketDataToggle = (checked: boolean) => {
    setShowMarketData(checked);
    handleCategoryToggle('market-data', checked);
  };
  useEffect(() => {
    if (!map.current || !mapboxgl || !mapboxToken || loading || dataLoading) {
      return;
    }

    // Ensure map is fully loaded before adding markers
    const updateMarkers = () => {
      if (map.current && map.current.isStyleLoaded() && mapboxgl) {
        addMarkersToMap();
      } else {
        // Retry after a short delay
        setTimeout(updateMarkers, 200);
      }
    };

    // Small delay to ensure all data is ready
    const timeoutId = setTimeout(updateMarkers, 150);
    
    return () => clearTimeout(timeoutId);
  }, [properties, calculationProperties, showMyProperties, showRentalProperties, showCalculationProperties, showMarketData, mapboxToken, loading, dataLoading]);

  // Map is now available to all logged-in users
  
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
                  <div className="w-3 h-3 bg-white border border-gray-400 rounded-full"></div>
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
          ) : !user ? (
            <div className="flex items-center justify-center h-96 bg-muted/50 rounded-lg">
              <div className="text-center">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="font-medium mb-2">Logg inn for å se kartet</p>
                <p className="text-muted-foreground text-sm">Kartfunksjonen krever innlogging</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-96 bg-muted/50 rounded-lg">
              <div className="text-center">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <p className="text-red-500 font-medium mb-2">Kartfeil</p>
                <p className="text-muted-foreground text-sm">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={async () => {
                    setError(null);
                    setLoading(true);
                    setRetryCount(0);
                    try {
                      await fetchMapboxToken(true);
                    } catch (error) {
                      console.error('Manual retry failed:', error);
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
                className="h-96 w-full rounded-lg border overflow-hidden"
                style={{ position: 'relative' }}
              />
              
              {/* Legend - Hidden on mobile */}
              <Card className="absolute top-4 right-4 w-64 bg-background/95 backdrop-blur hidden sm:block">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Leiekart</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Home className="h-3 w-3 text-blue-500" />
                      <span>Blå = Dine eiendommer</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Home className="h-3 w-3 text-green-500" />
                      <span>Grønn = Utleie-enheter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calculator className="h-3 w-3 text-gray-500" />
                      <span>Hvit = Kalkulasjoner</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full" />
                      <span>Farget = Markedsdata</span>
                    </div>
                    <p className="text-muted-foreground pt-2 border-t">
                      Klikk på markørene for detaljer
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-blue-600">
              {properties.length}
            </CardTitle>
            <p className="text-xs text-muted-foreground">Mine eiendommer</p>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-green-600">
              {properties.filter(p => p.show_in_rental === true).length}
            </CardTitle>
            <p className="text-xs text-muted-foreground">Utleid</p>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-gray-600">
              {calculationProperties.length}
            </CardTitle>
            <p className="text-xs text-muted-foreground">Kalkulasjoner</p>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-primary">
              {(() => {
                const rentalProperties = properties.filter(p => p.show_in_rental && p.monthly_rent && p.current_value);
                if (rentalProperties.length === 0) return '0.0';
                
                const avgYield = rentalProperties.reduce((sum, prop) => {
                  return sum + ((prop.monthly_rent || 0) * 12 / (prop.current_value || 1) * 100);
                }, 0) / rentalProperties.length;
                
                return avgYield.toFixed(1);
              })()}%
            </CardTitle>
            <p className="text-xs text-muted-foreground">Gj.snitt avkastning</p>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default RentalMap;