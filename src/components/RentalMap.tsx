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
  console.log('🎬 RentalMap component initializing...');
  
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
  const [showRentalProperties, setShowRentalProperties] = useState(true);
  const [showCalculationProperties, setShowCalculationProperties] = useState(true);
  const [showMarketData, setShowMarketData] = useState(true);

  console.log('🔧 Component state:', {
    user: !!user,
    loading,
    error,
    mapboxToken: mapboxToken ? 'Set' : 'Not set',
    showMyProperties,
    showRentalProperties,
    showCalculationProperties,
    showMarketData
  });

  // Get data
  const { properties, calculationProperties, loading: dataLoading } = useOptimizedPropertyData();

  console.log('📊 Data state:', {
    properties: properties?.length || 0,
    calculationProperties: calculationProperties?.length || 0,
    dataLoading
  });

  // Fetch Mapbox token
  const fetchMapboxToken = async () => {
    console.log('🔑 Starting token fetch...');
    try {
      console.log('🔄 Calling supabase edge function...');
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      
      console.log('📨 Edge function response:', { data, error });
      
      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(`Edge function failed: ${error.message}`);
      }

      if (data?.success && data?.token && data.token.startsWith('pk.')) {
        console.log('✅ Valid Mapbox token received:', {
          success: data.success,
          tokenLength: data.token.length,
          tokenPrefix: data.token.substring(0, 20) + '...'
        });
        setMapboxToken(data.token);
        return data.token;
      } else {
        console.error('❌ Invalid token response:', data);
        throw new Error('Invalid token response');
      }
    } catch (error: any) {
      console.error('❌ Token fetch failed:', error);
      setError(`Kunne ikke hente Mapbox token: ${error.message}`);
      return null;
    }
  };

  // Clear markers
  const clearMarkers = () => {
    console.log('🧹 Clearing markers:', markers.current.length);
    markers.current.forEach(marker => {
      try {
        marker?.remove();
      } catch (e) {
        console.warn('⚠️ Error removing marker:', e);
      }
    });
    markers.current = [];
  };

  // Initialize map once
  useEffect(() => {
    console.log('🎯 Map initialization useEffect triggered');
    
    if (!user) {
      console.log('❌ No user, skipping map initialization');
      setLoading(false);
      return;
    }

    console.log('👤 User exists, proceeding with map initialization');

    let mapboxgl: any = null;
    let mapInstance: any = null;

    const initializeMap = async () => {
      console.log('🚀 Starting map initialization...');
      
      try {
        // Load Mapbox GL
        console.log('📦 Loading Mapbox GL module...');
        const mapboxModule = await import('mapbox-gl');
        mapboxgl = mapboxModule.default;
        console.log('✅ Mapbox GL loaded successfully:', !!mapboxgl);

        // Get token
        console.log('🔑 Getting token...');
        const token = mapboxToken || await fetchMapboxToken();
        console.log('🎫 Token status:', token ? 'Available' : 'Failed');
        
        if (!token) {
          console.error('❌ No token available, cannot initialize map');
          return;
        }

        // Set access token
        console.log('🔐 Setting mapbox access token...');
        mapboxgl.accessToken = token;
        console.log('✅ Access token set');

        // Check container
        console.log('📦 Checking map container:', {
          exists: !!mapContainer.current,
          mapExists: !!map.current
        });

        // Create map
        if (mapContainer.current && !map.current) {
          console.log('🗺️ Creating map instance...');
          
          const mapConfig = {
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [10.7522, 59.9139], // Oslo
            zoom: 6,
            attributionControl: false
          };
          
          console.log('⚙️ Map config:', mapConfig);
          
          mapInstance = new mapboxgl.Map(mapConfig);
          map.current = mapInstance;
          
          console.log('✅ Map instance created:', !!mapInstance);

          // Add navigation controls
          console.log('🧭 Adding navigation controls...');
          const navControl = new mapboxgl.NavigationControl();
          mapInstance.addControl(navControl, 'top-right');
          console.log('✅ Navigation controls added');

          // Wait for map to load
          mapInstance.on('load', () => {
            console.log('🎉 Map loaded successfully!');
            setLoading(false);
            addMarkers();
          });

          // Handle errors
          mapInstance.on('error', (e: any) => {
            console.error('❌ Map error event:', e);
            setError('Kartfeil oppstod');
          });

          // Additional debugging events
          mapInstance.on('styledata', () => {
            console.log('🎨 Map style loaded');
          });

          mapInstance.on('sourcedata', (e: any) => {
            console.log('📡 Map source data:', e.sourceId);
          });

        } else {
          console.warn('⚠️ Cannot create map:', {
            hasContainer: !!mapContainer.current,
            mapAlreadyExists: !!map.current
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
      console.log('🧹 Cleaning up map...');
      if (mapInstance) {
        console.log('🗑️ Removing map instance');
        mapInstance.remove();
      }
      if (map.current) {
        console.log('🗑️ Clearing map ref');
        map.current = null;
      }
      clearMarkers();
    };
  }, [user, mapboxToken]);

  // Add markers to map
  const addMarkers = async () => {
    console.log('🎯 Adding markers function called');
    console.log('📊 Current state for markers:', {
      mapExists: !!map.current,
      loading,
      dataLoading,
      propertiesCount: properties?.length || 0,
      calculationsCount: calculationProperties?.length || 0
    });

    if (!map.current || loading || dataLoading) {
      console.log('⚠️ Map not ready for markers:', {
        mapExists: !!map.current,
        loading,
        dataLoading
      });
      return;
    }

    console.log('🎯 Proceeding with marker addition...');
    clearMarkers();

    let allMarkers: any[] = [];
    let bounds: any = null;

    // Import mapbox for bounds calculation
    try {
      console.log('📦 Loading mapbox for markers...');
      const mapboxModule = await import('mapbox-gl');
      const mapboxgl = mapboxModule.default;
      bounds = new mapboxgl.LngLatBounds();
      console.log('✅ Mapbox loaded for markers, bounds created');

      // Add property markers
      if (showMyProperties && properties && properties.length > 0) {
        console.log(`📍 Processing ${properties.length} property markers`);
        
        properties.forEach((property, index) => {
          console.log(`🏠 Processing property ${index + 1}:`, {
            address: property.address,
            hasCoordinates: !!property.coordinates,
            coordinates: property.coordinates
          });
          
          if (property.coordinates && property.coordinates.length === 2) {
            console.log(`✅ Creating marker for property: ${property.address}`);
            
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
            console.log(`✅ Added property marker at [${property.coordinates[0]}, ${property.coordinates[1]}]`);
          } else {
            console.warn(`❌ Property ${index + 1} missing valid coordinates:`, property);
          }
        });
      }

      // Add calculation markers
      if (showCalculationProperties && calculationProperties && calculationProperties.length > 0) {
        console.log(`🧮 Processing ${calculationProperties.length} calculation markers`);
        
        calculationProperties.forEach((calc, index) => {
          console.log(`📊 Processing calculation ${index + 1}:`, {
            address: calc.property_address,
            hasCoordinates: !!calc.coordinates,
            coordinates: calc.coordinates
          });
          
          if (calc.coordinates && calc.coordinates.length === 2) {
            console.log(`✅ Creating marker for calculation: ${calc.property_address}`);
            
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
            console.log(`✅ Added calculation marker at [${calc.coordinates[0]}, ${calc.coordinates[1]}]`);
          } else {
            console.warn(`❌ Calculation ${index + 1} missing valid coordinates:`, calc);
          }
        });
      }

      // Update markers ref
      markers.current = allMarkers;
      console.log(`📌 Total markers added: ${allMarkers.length}`);

      // Center map on markers
      if (allMarkers.length > 0) {
        console.log(`🎯 Centering map on ${allMarkers.length} markers`);
        
        try {
          if (allMarkers.length === 1) {
            // Single marker: center on it
            const lngLat = allMarkers[0].getLngLat();
            console.log('📍 Centering on single marker:', lngLat);
            map.current.setCenter([lngLat.lng, lngLat.lat]);
            map.current.setZoom(12);
          } else {
            // Multiple markers: fit bounds
            console.log('📍 Fitting bounds for multiple markers');
            map.current.fitBounds(bounds, {
              padding: 50,
              maxZoom: 14
            });
          }
          console.log('✅ Map centered successfully');
        } catch (centerError) {
          console.error('❌ Error centering map:', centerError);
        }
      } else {
        // No markers: center on Norway
        console.log('📍 No markers found, centering on Norway');
        map.current.setCenter([10.7522, 59.9139]);
        map.current.setZoom(6);
      }

      console.log(`🎉 Marker addition completed successfully!`);
    } catch (error) {
      console.error('❌ Failed to add markers:', error);
      setError(`Kunne ikke legge til markører: ${error.message}`);
    }
  };

  // Update markers when data or toggles change
  useEffect(() => {
    console.log('🔄 Marker update useEffect triggered:', {
      loading,
      dataLoading,
      showMyProperties,
      showRentalProperties,
      showCalculationProperties,
      showMarketData
    });
    
    if (!loading && !dataLoading) {
      console.log('✅ Conditions met, calling addMarkers');
      addMarkers();
    } else {
      console.log('⏳ Waiting for loading to complete');
    }
  }, [showMyProperties, showRentalProperties, showCalculationProperties, showMarketData, properties, calculationProperties, loading, dataLoading]);

  console.log('🎨 Rendering component with state:', {
    user: !!user,
    error,
    loading
  });

  if (!user) {
    console.log('🚫 Rendering no-user state');
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <CardContent>
          <p className="text-muted-foreground">Logg inn for å se kartet</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    console.log('💥 Rendering error state:', error);
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <CardContent>
          <p className="text-red-500">{error}</p>
          <Button 
            onClick={() => {
              console.log('🔄 Retry button clicked');
              setError(null);
              setLoading(true);
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

  console.log('🎨 Rendering main component');
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
                  onCheckedChange={(checked) => {
                    console.log('🏠 My properties toggle:', checked);
                    setShowMyProperties(checked);
                  }}
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
                  onCheckedChange={(checked) => {
                    console.log('🏘️ Rental properties toggle:', checked);
                    setShowRentalProperties(checked);
                  }}
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
                  onCheckedChange={(checked) => {
                    console.log('🧮 Calculation properties toggle:', checked);
                    setShowCalculationProperties(checked);
                  }}
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
                  onCheckedChange={(checked) => {
                    console.log('📊 Market data toggle:', checked);
                    setShowMarketData(checked);
                  }}
                />
                <Label htmlFor="market-data" className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full border border-white"></div>
                  Markedsdata
                </Label>
              </div>
            </div>

            {/* Debug Info */}
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              Debug: Loading={loading.toString()}, DataLoading={dataLoading.toString()}, 
              Properties={properties?.length || 0}, Calculations={calculationProperties?.length || 0},
              Token={mapboxToken ? 'Set' : 'Not set'}
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
              <div 
                ref={mapContainer} 
                className="w-full h-full"
                style={{ background: '#f0f0f0' }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RentalMap;