import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOptimizedPropertyData } from "@/hooks/useOptimizedPropertyData";
import { formatNumberWithSpaces } from "@/lib/utils";

interface MapMarker {
  id: string;
  coordinates: [number, number];
  type: 'property' | 'calculation';
  data: any;
}

const SimpleMap = () => {
  const { user } = useAuth();
  const { properties, calculationProperties } = useOptimizedPropertyData();
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  
  // Layer toggles
  const [showMyProperties, setShowMyProperties] = useState(true);
  const [showCalculationProperties, setShowCalculationProperties] = useState(true);

  useEffect(() => {
    const newMarkers: MapMarker[] = [];

    // Add property markers
    if (showMyProperties && properties) {
      properties.forEach((property) => {
        if (property.coordinates && property.coordinates.length === 2) {
          newMarkers.push({
            id: `property-${property.id}`,
            coordinates: property.coordinates as [number, number],
            type: 'property',
            data: property
          });
        }
      });
    }

    // Add calculation markers
    if (showCalculationProperties && calculationProperties) {
      calculationProperties.forEach((calc) => {
        if (calc.coordinates && calc.coordinates.length === 2) {
          newMarkers.push({
            id: `calc-${calc.id}`,
            coordinates: calc.coordinates as [number, number],
            type: 'calculation',
            data: calc
          });
        }
      });
    }

    setMarkers(newMarkers);
  }, [properties, calculationProperties, showMyProperties, showCalculationProperties]);

  // Calculate bounds and positioning
  const getBounds = () => {
    if (markers.length === 0) return null;
    
    const lngs = markers.map(m => m.coordinates[0]);
    const lats = markers.map(m => m.coordinates[1]);
    
    return {
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats)
    };
  };

  const bounds = getBounds();

  const getMarkerPosition = (coordinates: [number, number]) => {
    if (!bounds) return { left: '50%', top: '50%' };
    
    const [lng, lat] = coordinates;
    const lngRange = bounds.maxLng - bounds.minLng || 1;
    const latRange = bounds.maxLat - bounds.minLat || 1;
    
    const padding = 50; // pixels
    const mapWidth = 500 - (padding * 2);
    const mapHeight = 400 - (padding * 2);
    
    const x = padding + ((lng - bounds.minLng) / lngRange) * mapWidth;
    const y = padding + ((bounds.maxLat - lat) / latRange) * mapHeight; // Inverted Y
    
    return { left: `${x}px`, top: `${y}px` };
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
                  id="calculation-properties"
                  checked={showCalculationProperties}
                  onCheckedChange={setShowCalculationProperties}
                />
                <Label htmlFor="calculation-properties" className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full border border-white"></div>
                  Kalkulasjoner
                </Label>
              </div>
            </div>

            {/* Map Container */}
            <div className="relative w-full h-[500px] rounded-lg overflow-hidden border bg-slate-100">
              {/* Grid background for map feel */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
                  backgroundSize: '20px 20px'
                }}
              />
              
              {/* Compass rose */}
              <div className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md">
                <div className="w-8 h-8 relative">
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">N</div>
                  <div className="absolute inset-0 border border-gray-300 rounded-full"></div>
                </div>
              </div>
              
              {/* Markers */}
              {markers.map((marker) => {
                const position = getMarkerPosition(marker.coordinates);
                const isProperty = marker.type === 'property';
                
                return (
                  <div
                    key={marker.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                    style={position}
                    onClick={() => setSelectedMarker(marker)}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                        isProperty ? 'bg-blue-500' : 'bg-amber-500'
                      } hover:scale-110 transition-transform`}
                    />
                  </div>
                );
              })}
              
              {/* Popup for selected marker */}
              {selectedMarker && (
                <div
                  className="absolute z-20 bg-white rounded-lg shadow-lg p-3 border max-w-xs"
                  style={{
                    ...getMarkerPosition(selectedMarker.coordinates),
                    transform: 'translate(-50%, -100%)',
                    marginTop: '-10px'
                  }}
                >
                  <div className="space-y-1">
                    {selectedMarker.type === 'property' ? (
                      <>
                        <h3 className="font-semibold text-sm">{selectedMarker.data.address}</h3>
                        <p className="text-xs text-gray-600">Type: {selectedMarker.data.property_type || 'Ikke spesifisert'}</p>
                        {selectedMarker.data.monthly_rent && (
                          <p className="text-xs text-gray-600">
                            Månedlig leie: {formatNumberWithSpaces(selectedMarker.data.monthly_rent)} NOK
                          </p>
                        )}
                        {selectedMarker.data.current_value && (
                          <p className="text-xs text-gray-600">
                            Verdi: {formatNumberWithSpaces(selectedMarker.data.current_value)} NOK
                          </p>
                        )}
                        {selectedMarker.data.primary_residence && (
                          <p className="text-xs text-green-600 font-medium">🏠 Primærbolig</p>
                        )}
                      </>
                    ) : (
                      <>
                        <h3 className="font-semibold text-sm">{selectedMarker.data.property_address}</h3>
                        <p className="text-xs text-gray-600">
                          Kalkyle: {selectedMarker.data.calculation_data?.calculation_name || 'Uten navn'}
                        </p>
                        <p className="text-xs text-gray-600">Finn-kode: {selectedMarker.data.finn_code}</p>
                        {selectedMarker.data.results_data?.totalPrice && (
                          <p className="text-xs text-gray-600">
                            Pris: {formatNumberWithSpaces(selectedMarker.data.results_data.totalPrice)} NOK
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Close button */}
                  <button
                    className="absolute -top-2 -right-2 w-6 h-6 bg-gray-500 text-white rounded-full text-xs hover:bg-gray-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMarker(null);
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
              
              {/* Info overlay when no markers */}
              {markers.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Ingen eiendommer å vise</p>
                    <p className="text-xs">Legg til eiendommer eller kjør kalkulasjoner for å se dem på kartet</p>
                  </div>
                </div>
              )}
              
              {/* Scale indicator */}
              {bounds && (
                <div className="absolute bottom-4 left-4 bg-white px-2 py-1 rounded text-xs shadow-md">
                  {markers.length} {markers.length === 1 ? 'markør' : 'markører'} vist
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleMap;