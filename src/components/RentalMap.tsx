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

  // Layer toggles with localStorage persistence
  const [showMyProperties, setShowMyProperties] = useState(() => {
    const saved = localStorage.getItem('rentalMap_showMyProperties');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showRentalProperties, setShowRentalProperties] = useState(() => {
    const saved = localStorage.getItem('rentalMap_showRentalProperties');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showCalculationProperties, setShowCalculationProperties] = useState(() => {
    const saved = localStorage.getItem('rentalMap_showCalculationProperties');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showMarketData, setShowMarketData] = useState(() => {
    const saved = localStorage.getItem('rentalMap_showMarketData');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const { properties, calculationProperties, loading: dataLoading } = useOptimizedPropertyData();

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
    // Only fetch token if user is authenticated
    if (!user) {
      setLoading(false);
      return;
    }
    
    console.log('Token fetch effect - user authenticated');
    
    // Only fetch token if user is authenticated
    const fetchToken = async () => {
      console.log('Fetching Mapbox token...');
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        console.log('Token response:', { data, error });
        
        if (error) {
          console.error('Supabase function error:', error);
          throw error;
        }

        if (data?.token) {
          console.log('Token received, length:', data.token.length);
          setMapboxToken(data.token);
        } else {
          console.error('No token in response:', data);
          throw new Error('Ingen token mottatt');
        }
      } catch (error) {
        console.error('Token fetch error:', error);
        toast({
          title: "Kartfeil",
          description: `Kunne ikke hente Mapbox token: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        console.log('Token fetch complete, setting loading to false');
        setLoading(false);
      }
    };

    // Only fetch token once
    if (!mapboxToken) {
      fetchToken();
    } else {
      setLoading(false);
    }
  }, [toast, user, mapboxToken]);

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
        el.innerHTML = '<div style="color: white; font-size: 10px; text-align: center; line-height: 14px;">💰</div>';
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
    
    return el;
  };

  // Add markers to map
  const addMarkersToMap = () => {
    if (!map.current || !mapboxgl) {
      console.log('Map or mapboxgl not ready');
      return;
    }
    
    console.log('Adding markers to map. Properties:', properties.length, 'Calculations:', calculationProperties.length);
    
    clearMarkers();

    // Add user's properties (blue pins)
    if (showMyProperties) {
      properties.forEach((property) => {
        if (!property.coordinates || !Array.isArray(property.coordinates) || property.coordinates.length !== 2) {
          console.log('Property missing coordinates:', property.address);
          return;
        }
        
        console.log('Adding property marker:', property.address, property.coordinates);
        
        const el = createMarkerElement('my-property');
        
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div class="font-medium text-sm p-2">
            <h3 class="font-bold text-blue-600">Min eiendom</h3>
            <p class="font-semibold">${property.address}</p>
            ${property.city ? `<p class="text-gray-600">${property.city}</p>` : ''}
            <div class="mt-2 space-y-1">
              <p><strong>Type:</strong> ${property.property_type || 'Ikke oppgitt'}</p>
              ${property.current_value ? `<p><strong>Verdi:</strong> ${formatNumberWithSpaces(property.current_value)} kr</p>` : ''}
              ${property.monthly_rent ? `<p><strong>Månedlig leie:</strong> ${formatNumberWithSpaces(property.monthly_rent)} kr</p>` : ''}
            </div>
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([property.coordinates[0], property.coordinates[1]])
          .setPopup(popup)
          .addTo(map.current!);
          
        markers.current.push(marker);
        
        // Center map on first property
        if (markers.current.length === 1) {
          map.current!.flyTo({
            center: [property.coordinates[0], property.coordinates[1]],
            zoom: 12,
            duration: 2000
          });
        }
      });
    }

    // Add rental properties (green pins) 
    if (showRentalProperties) {
      properties.filter(p => p.show_in_rental && p.monthly_rent).forEach((property) => {
        if (!property.coordinates || !Array.isArray(property.coordinates) || property.coordinates.length !== 2) {
          return;
        }
        
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
              <p><strong>Månedlig leie:</strong> ${formatNumberWithSpaces(property.monthly_rent || 0)} kr</p>
              ${yield_ > 0 ? `<p><strong>Avkastning:</strong> <span class="font-semibold text-green-600">${yield_.toFixed(1)}%</span></p>` : ''}
            </div>
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([property.coordinates[0], property.coordinates[1]])
          .setPopup(popup)
          .addTo(map.current!);
          
        markers.current.push(marker);
      });
    }

    // Add calculation properties (white pins)
    if (showCalculationProperties) {
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

        const marker = new mapboxgl.Marker(el)
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

        const marker = new mapboxgl.Marker(el)
          .setLngLat(location.coordinates as [number, number])
          .setPopup(popup)
          .addTo(map.current!);
          
        markers.current.push(marker);
      });
    }
    
    console.log('Added', markers.current.length, 'markers to map');
  };

  // Initialize map
  useEffect(() => {
    if (!mapboxToken || !mapboxgl || !mapContainer.current || map.current) {
      return;
    }

    console.log('Initializing map with token:', mapboxToken.substring(0, 10) + '...');

    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11', // Use v11 which is more stable
        center: [10.7522, 59.9139], // Oslo
        zoom: 6,
        attributionControl: false, // Disable attribution to prevent issues
      });

      map.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );

      map.current.on('load', () => {
        console.log('Map loaded successfully!');
        // Small delay to ensure map is fully ready
        setTimeout(() => {
          addMarkersToMap();
        }, 500);
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        
        // Only show error toast for critical errors, not recoverable ones
        const errorMessage = e.error?.message || e.message || 'Ukjent feil';
        const isRecoverableError = errorMessage.includes('NetworkError') || 
                                 errorMessage.includes('timeout') ||
                                 errorMessage.includes('Failed to fetch') ||
                                 errorMessage.includes('StyleError') ||
                                 errorMessage.includes('RequestManager') ||
                                 errorMessage.includes('TileLoadError');
        
        if (!isRecoverableError) {
          toast({
            title: "Kartfeil",
            description: `Mapbox feil: ${errorMessage}`,
            variant: "destructive",
          });
        }
      });

      map.current.on('styledata', () => {
        console.log('Map style loaded');
      });

      map.current.on('sourcedata', (e) => {
        if (e.isSourceLoaded) {
          console.log('Map source loaded');
        }
      });

    } catch (error) {
      console.error('Map initialization error:', error);
      toast({
        title: "Kartfeil",
        description: `Kunne ikke initialisere kartet: ${error instanceof Error ? error.message : 'Ukjent feil'}`,
        variant: "destructive",
      });
    }

    return () => {
      clearMarkers();
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken, mapboxgl, toast]);

  // Update markers when data or layer settings change
  useEffect(() => {
    if (map.current && mapboxgl && mapboxToken && !loading && !dataLoading) {
      const timeoutId = setTimeout(() => {
        console.log('Triggering marker update');
        addMarkersToMap();
      }, 200); // Slightly longer debounce
      
      return () => clearTimeout(timeoutId);
    }
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
                  onCheckedChange={setShowMyProperties}
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
                  onCheckedChange={setShowRentalProperties}
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
                  onCheckedChange={setShowCalculationProperties}
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
                  onCheckedChange={setShowMarketData}
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
          ) : (
            <div className="relative">
              <div ref={mapContainer} className="h-96 w-full rounded-lg border" />
              
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
                      <DollarSign className="h-3 w-3 text-green-500" />
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
              {properties.filter(p => p.show_in_rental && p.monthly_rent).length}
            </CardTitle>
            <p className="text-xs text-muted-foreground">Utleie-enheter</p>
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