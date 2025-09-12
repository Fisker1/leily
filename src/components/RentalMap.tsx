import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, TrendingUp, Home, DollarSign, Calculator } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePropertyData } from "@/hooks/usePropertyData";
import { formatNumberWithSpaces } from "@/lib/utils";

const RentalMap = () => {
  const { isPro } = useSubscription();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('kommune');
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [mapboxgl, setMapboxgl] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Layer toggles
  const [showMyProperties, setShowMyProperties] = useState(true);
  const [showRentalProperties, setShowRentalProperties] = useState(true);
  const [showCalculationProperties, setShowCalculationProperties] = useState(true);
  const [showMarketData, setShowMarketData] = useState(false);

  const { properties, calculationProperties, loading: dataLoading } = usePropertyData();

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
    console.log('Token fetch effect - isPro:', isPro);
    
    if (!isPro) {
      console.log('User not Pro, setting loading to false');
      setLoading(false);
      return;
    }

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

    fetchToken();
  }, [isPro, toast]);

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
    if (!map.current || !mapboxgl) return;
    
    clearMarkers();

    // Add user's properties (blue pins)
    if (showMyProperties) {
      properties.forEach((property) => {
        if (!property.coordinates) return;
        
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
          .setLngLat(property.coordinates)
          .setPopup(popup)
          .addTo(map.current!);
          
        markers.current.push(marker);
      });
    }

    // Add rental properties (green pins) 
    if (showRentalProperties) {
      properties.filter(p => p.show_in_rental && p.monthly_rent).forEach((property) => {
        if (!property.coordinates) return;
        
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
          .setLngLat(property.coordinates)
          .setPopup(popup)
          .addTo(map.current!);
          
        markers.current.push(marker);
      });
    }

    // Add calculation properties (white pins)
    if (showCalculationProperties) {
      calculationProperties.forEach((calc) => {
        if (!calc.coordinates) return;
        
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
          .setLngLat(calc.coordinates)
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
  };

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
        addMarkersToMap();
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        toast({
          title: "Kartfeil",
          description: `Mapbox feil: ${e.error?.message || 'Ukjent feil'}`,
          variant: "destructive",
        });
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
      }
    };
  }, [isPro, mapboxToken, mapboxgl, toast]);

  // Update markers when data or layer settings change
  useEffect(() => {
    if (map.current && mapboxToken) {
      addMarkersToMap();
    }
  }, [properties, calculationProperties, showMyProperties, showRentalProperties, showCalculationProperties, showMarketData, mapboxgl]);

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    toast({
      title: "Kommer snart",
      description: `${value === 'kommune' ? 'Kommune' : 'Bydel'}-nivå data kommer i neste versjon`,
    });
  };

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
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-sm font-medium whitespace-nowrap">Geografinivå:</label>
              <Select value={selectedRegion} onValueChange={handleRegionChange}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kommune">Kommune</SelectItem>
                  <SelectItem value="bydel">Bydel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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