import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, TrendingUp, AlertCircle, Home, DollarSign, Calculator } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePropertyData } from "@/hooks/usePropertyData";
import { formatNumberWithSpaces } from "@/lib/utils";

const RentalMap = () => {
  const { isPro } = useSubscription();
  const { user } = useAuth();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('kommune');
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  
  // Layer toggles
  const [showMyProperties, setShowMyProperties] = useState(true);
  const [showRentalProperties, setShowRentalProperties] = useState(true);
  const [showCalculationProperties, setShowCalculationProperties] = useState(true);
  const [showMarketData, setShowMarketData] = useState(false);

  const { properties, calculationProperties, loading: dataLoading } = usePropertyData();

  // Fetch Mapbox token from Supabase Edge Function
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) {
          console.error('Error fetching Mapbox token:', error);
          toast({
            title: "Kartfeil",
            description: "Kunne ikke laste inn kartfunksjonalitet",
            variant: "destructive",
          });
          return;
        }

        if (data?.token) {
          setMapboxToken(data.token);
        }
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
        toast({
          title: "Kartfeil", 
          description: "Kunne ikke laste inn kartfunksjonalitet",
          variant: "destructive",
        });
      }
    };

    if (isPro) {
      fetchMapboxToken();
    }
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
    if (!map.current) return;
    
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
    if (!mapContainer.current || !mapboxToken || !isPro) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [10.7522, 59.9139], // Oslo center
      zoom: 8,
    });

    // Add navigation controls  
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.on('load', () => {
      addMarkersToMap();
    });

    return () => {
      clearMarkers();
      map.current?.remove();
    };
  }, [mapboxToken, isPro]);

  // Update markers when data or layer settings change
  useEffect(() => {
    if (map.current && mapboxToken) {
      addMarkersToMap();
    }
  }, [properties, calculationProperties, showMyProperties, showRentalProperties, showCalculationProperties, showMarketData]);

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    // TODO: Implement region-specific data loading
    toast({
      title: "Kommer snart",
      description: `${value === 'kommune' ? 'Kommune' : 'Bydel'}-nivå data kommer i neste versjon`,
    });
  };

  if (!isPro) {
    return (
      <div className="space-y-6">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Leiekart - Pro-funksjon
            </CardTitle>
            <CardDescription>
              Visualiser avkastning og leiepriser geografisk for å finne de beste investeringsmulighetene
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-6 rounded-lg text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Oppgrader til Pro</h3>
              <p className="text-muted-foreground mb-4">
                Få tilgang til interaktive kart med markedsdata, avkastning og leietrender for hele Norge
              </p>
              <Badge variant="secondary" className="mb-4">Pro-funksjon</Badge>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-sm">
                <div className="bg-background p-4 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600 mb-2" />
                  <h4 className="font-medium">Markedsanalyser</h4>
                  <p className="text-muted-foreground">Se avkastning og leiepriser per område</p>
                </div>
                <div className="bg-background p-4 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-600 mb-2" />
                  <h4 className="font-medium">Geografisk oversikt</h4>
                  <p className="text-muted-foreground">Interaktive kart ned til kommune-nivå</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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

          {!mapboxToken || dataLoading ? (
            <div className="flex items-center justify-center h-96 bg-muted/50 rounded-lg">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">
                  {!mapboxToken ? 'Laster inn kart...' : 'Henter eiendommer...'}
                </p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div ref={mapContainer} className="h-96 rounded-lg shadow-medium" />
              
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
                    <p className="text-muted-foreground mt-2">
                      Klikk på markørene for detaljer
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Mine eiendommer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{properties.length}</div>
            <p className="text-xs text-muted-foreground">Totalt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Utleie-enheter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {properties.filter(p => p.show_in_rental && p.monthly_rent).length}
            </div>
            <p className="text-xs text-muted-foreground">Aktive</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Kalkulasjoner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{calculationProperties.length}</div>
            <p className="text-xs text-muted-foreground">Lagrede</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Gj.snitt avkastning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {properties.filter(p => p.monthly_rent && p.current_value).length > 0
                ? (properties
                    .filter(p => p.monthly_rent && p.current_value)
                    .reduce((acc, p) => acc + (p.monthly_rent! * 12 / p.current_value! * 100), 0) / 
                   properties.filter(p => p.monthly_rent && p.current_value).length
                  ).toFixed(1)
                : '0.0'
              }%
            </div>
            <p className="text-xs text-muted-foreground">Mine utleier</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RentalMap;