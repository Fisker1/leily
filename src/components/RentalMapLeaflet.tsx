import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOptimizedPropertyData } from "@/hooks/useOptimizedPropertyData";
import { formatNumberWithSpaces } from "@/lib/utils";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const createIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background-color: ${color};
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const propertyIcon = createIcon('#3b82f6'); // Blue
const calculationIcon = createIcon('#f59e0b'); // Amber
const rentalIcon = createIcon('#10b981'); // Green
const marketIcon = createIcon('#ef4444'); // Red

const RentalMapLeaflet = () => {
  const { user } = useAuth();
  const { properties, calculationProperties, loading: dataLoading } = useOptimizedPropertyData();

  // Layer toggles
  const [showMyProperties, setShowMyProperties] = React.useState(true);
  const [showRentalProperties, setShowRentalProperties] = React.useState(true);
  const [showCalculationProperties, setShowCalculationProperties] = React.useState(true);
  const [showMarketData, setShowMarketData] = React.useState(true);

  if (!user) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <CardContent>
          <p className="text-muted-foreground">Logg inn for å se kartet</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate bounds for all markers
  const calculateBounds = () => {
    const allCoords: [number, number][] = [];
    
    if (showMyProperties && properties) {
      properties.forEach(prop => {
        if (prop.coordinates && prop.coordinates.length === 2) {
          allCoords.push([prop.coordinates[1], prop.coordinates[0]]); // Leaflet uses [lat, lng]
        }
      });
    }
    
    if (showCalculationProperties && calculationProperties) {
      calculationProperties.forEach(calc => {
        if (calc.coordinates && calc.coordinates.length === 2) {
          allCoords.push([calc.coordinates[1], calc.coordinates[0]]); // Leaflet uses [lat, lng]
        }
      });
    }
    
    if (allCoords.length === 0) {
      return [[59.9139, 10.7522]] as [number, number][]; // Oslo default
    }
    
    return allCoords;
  };

  const bounds = calculateBounds();
  const center: [number, number] = bounds.length > 0 ? bounds[0] : [59.9139, 10.7522];

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
              <MapContainer
                center={center}
                zoom={bounds.length > 1 ? 10 : 6}
                style={{ height: '100%', width: '100%' }}
                bounds={bounds.length > 1 ? bounds : undefined}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Property markers */}
                {showMyProperties && properties && properties.map((property) => {
                  if (!property.coordinates || property.coordinates.length !== 2) return null;
                  
                  return (
                    <Marker
                      key={property.id}
                      position={[property.coordinates[1], property.coordinates[0]]}
                      icon={propertyIcon}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-semibold text-sm mb-2">{property.address}</h3>
                          <p className="text-xs text-gray-600 mb-1">Type: {property.property_type || 'Ikke spesifisert'}</p>
                          {property.monthly_rent && (
                            <p className="text-xs text-gray-600 mb-1">
                              Månedlig leie: {formatNumberWithSpaces(property.monthly_rent)} NOK
                            </p>
                          )}
                          {property.current_value && (
                            <p className="text-xs text-gray-600 mb-1">
                              Verdi: {formatNumberWithSpaces(property.current_value)} NOK
                            </p>
                          )}
                          {property.primary_residence && (
                            <p className="text-xs text-green-600 font-medium">🏠 Primærbolig</p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* Calculation markers */}
                {showCalculationProperties && calculationProperties && calculationProperties.map((calc) => {
                  if (!calc.coordinates || calc.coordinates.length !== 2) return null;
                  
                  return (
                    <Marker
                      key={calc.id}
                      position={[calc.coordinates[1], calc.coordinates[0]]}
                      icon={calculationIcon}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-semibold text-sm mb-2">{calc.property_address}</h3>
                          <p className="text-xs text-gray-600 mb-1">
                            Kalkyle: {calc.calculation_data?.calculation_name || 'Uten navn'}
                          </p>
                          <p className="text-xs text-gray-600 mb-1">Finn-kode: {calc.finn_code}</p>
                          {calc.results_data?.totalPrice && (
                            <p className="text-xs text-gray-600">
                              Pris: {formatNumberWithSpaces(calc.results_data.totalPrice)} NOK
                            </p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RentalMapLeaflet;