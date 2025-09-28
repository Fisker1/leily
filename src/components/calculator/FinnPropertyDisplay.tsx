import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { FinnPropertyData } from '@/types/finn';
import { formatNumberWithSpaces } from '@/lib/utils';

interface FinnPropertyDisplayProps {
  propertyData: FinnPropertyData;
  cached?: boolean;
  onClearData?: () => void;
  onViewOnFinn?: () => void;
}

export const FinnPropertyDisplay: React.FC<FinnPropertyDisplayProps> = ({
  propertyData,
  cached = false,
  onClearData,
  onViewOnFinn
}) => {
  // Helper function to check if a value exists and is valid
  const hasValue = (value: any): boolean => {
    return value !== null && value !== undefined && value !== '' && value !== 0;
  };

  // Get valid price data
  const priceData = [
    { label: 'Prisantydning', value: propertyData.price, primary: true },
    { label: 'Totalpris', value: propertyData.totalPrice },
    { label: 'Omkostninger', value: propertyData.additionalCosts },
    { label: 'Formuesverdi', value: propertyData.propertyValue },
    { label: 'Pris per m²', value: propertyData.pricePerSqm, suffix: '/m²' }
  ].filter(item => hasValue(item.value));

  // Get valid key information
  const keyInfo = [
    { label: 'Boligtype', value: propertyData.propertyType },
    { label: 'Eieform', value: propertyData.ownershipType },
    { label: 'Intern bruksareal', value: propertyData.livingArea, suffix: ' m²' },
    { label: 'Tomteareal', value: propertyData.totalArea, suffix: ' m²' },
    { label: 'Balkong/Terrasse', value: propertyData.balconyArea, suffix: ' m²' },
    { label: 'Soverom', value: propertyData.bedrooms },
    { label: 'Rom', value: propertyData.totalRooms },
    { label: 'Byggeår', value: propertyData.yearBuilt },
    { label: 'Energimerking', value: propertyData.energyRating },
    { label: 'Etasje', value: propertyData.floor }
  ].filter(item => hasValue(item.value));

  // Get valid monthly costs
  const monthlyCosts = [
    { label: 'Kommunale avg.', value: propertyData.municipalFees, suffix: '/mnd' },
    { label: 'Felleskost', value: propertyData.sharedCosts, suffix: '/mnd' },
    { label: 'Fellesformue', value: propertyData.sharedEquity },
    { label: 'Totalt per måned', value: propertyData.totalMonthlyCosts, suffix: '/mnd', primary: true }
  ].filter(item => hasValue(item.value));

  // Get facilities from both structured and raw data
  const facilities: string[] = [];
  
  // Add structured facilities
  const structuredFacilities = [
    { condition: propertyData.fireplace, label: 'Peis/Ildsted' },
    { condition: propertyData.balcony, label: 'Balkong' },
    { condition: propertyData.terrace, label: 'Terrasse' },
    { condition: propertyData.garden, label: 'Hage' },
    { condition: propertyData.garage, label: 'Garasje' },
    { condition: propertyData.publicWaterSewer, label: 'Offentlig vann/kloakk' },
    { condition: propertyData.internet || propertyData.internetIncluded, label: 'Bredbåndstilknytning' },
    { condition: propertyData.childFriendly, label: 'Barnevennlig' },
    { condition: propertyData.petsAllowed, label: 'Kjæledyr tillatt' },
    { condition: propertyData.quietArea, label: 'Rolig' },
    { condition: propertyData.centralLocation, label: 'Sentralt' },
    { condition: propertyData.hiking, label: 'Turterreng' },
    { condition: propertyData.chargingStation, label: 'Lademulighet' },
    { condition: propertyData.elevator, label: 'Heis' },
    { condition: propertyData.basement, label: 'Kjeller' },
    { condition: propertyData.attic, label: 'Loft' }
  ];

  structuredFacilities.forEach(facility => {
    if (facility.condition) {
      facilities.push(facility.label);
    }
  });

  // Add raw facilities that aren't duplicated
  if (propertyData.rawFacilities && Array.isArray(propertyData.rawFacilities)) {
    propertyData.rawFacilities.forEach(facility => {
      if (!facilities.some(f => f.toLowerCase().includes(facility.toLowerCase()))) {
        facilities.push(facility);
      }
    });
  }

  // Add view type if available
  if (hasValue(propertyData.viewType)) {
    facilities.push(`Utsikt: ${propertyData.viewType}`);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate">{propertyData.title || `Eiendom ${propertyData.finnCode}`}</h3>
          <p className="text-sm text-muted-foreground truncate">{propertyData.address || 'Adresse ikke tilgjengelig'}</p>
          {cached && (
            <Badge variant="outline" className="mt-1 text-xs">
              Data hentet fra Finn.no
            </Badge>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {onViewOnFinn && (
            <Button variant="outline" size="sm" onClick={onViewOnFinn}>
              <ExternalLink className="w-3 h-3 mr-1" />
              Vis på Finn.no
            </Button>
          )}
          {onClearData && (
            <Button variant="outline" size="sm" onClick={onClearData}>
              Fjern data
            </Button>
          )}
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Price Section */}
        {priceData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pris</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {priceData.map((item, index) => (
                <div key={index}>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className={`font-semibold ${item.primary ? 'text-lg text-primary' : 'text-sm'}`}>
                    {typeof item.value === 'number' ? formatNumberWithSpaces(item.value) : item.value} kr{item.suffix || ''}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Key Information */}
        {keyInfo.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Nøkkelinfo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {keyInfo.map((item, index) => (
                  <div key={index}>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-medium">
                      {typeof item.value === 'string' && item.value.toLowerCase() === item.value ? 
                        item.value.charAt(0).toUpperCase() + item.value.slice(1) : 
                        item.value}{item.suffix || ''}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Facilities */}
        {facilities.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Fasiliteter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {facilities.map((facility, index) => (
                  <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                    {facility}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Monthly Costs - separate row if available */}
      {monthlyCosts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Månedlige kostnader</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {monthlyCosts.map((item, index) => (
                <div key={index}>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className={`font-semibold ${item.primary ? 'text-primary' : ''}`}>
                    {formatNumberWithSpaces(item.value)} kr{item.suffix || ''}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Information - compact version */}
      {(hasValue(propertyData.agentName) || hasValue(propertyData.agencyName)) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Kontakt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              {hasValue(propertyData.agentName) && (
                <div>
                  <span className="font-medium">{propertyData.agentName}</span>
                  {hasValue(propertyData.agentTitle) && (
                    <span className="text-muted-foreground ml-2">{propertyData.agentTitle}</span>
                  )}
                </div>
              )}
              {hasValue(propertyData.agencyName) && (
                <p className="text-muted-foreground">{propertyData.agencyName}</p>
              )}
              <div className="flex gap-4 text-xs text-muted-foreground">
                {hasValue(propertyData.agentPhone) && <span>{propertyData.agentPhone}</span>}
                {hasValue(propertyData.agentEmail) && <span>{propertyData.agentEmail}</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};