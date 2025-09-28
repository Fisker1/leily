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
  // Group facilities into meaningful categories
  const facilityCategories = {
    // Indoor features
    indoor: [
      { key: 'fireplace', label: 'Peis', condition: propertyData.fireplace },
      { key: 'elevator', label: 'Heis', condition: propertyData.elevator },
      { key: 'basement', label: 'Kjeller', condition: propertyData.basement },
      { key: 'attic', label: 'Loft', condition: propertyData.attic }
    ],
    // Outdoor features  
    outdoor: [
      { key: 'balcony', label: 'Balkong', condition: propertyData.balcony },
      { key: 'terrace', label: 'Terrasse', condition: propertyData.terrace },
      { key: 'garden', label: 'Hage', condition: propertyData.garden },
      { key: 'garage', label: 'Garasje', condition: propertyData.garage }
    ],
    // Utilities & Services
    utilities: [
      { key: 'publicWaterSewer', label: 'Offentlig vann/kloakk', condition: propertyData.publicWaterSewer },
      { key: 'internet', label: 'Bredbåndstilknytning', condition: propertyData.internet || propertyData.internetIncluded },
      { key: 'chargingStation', label: 'Lademulighet', condition: propertyData.chargingStation }
    ],
    // Lifestyle & Location
    lifestyle: [
      { key: 'childFriendly', label: 'Barnevennlig', condition: propertyData.childFriendly },
      { key: 'petsAllowed', label: 'Kjæledyr tillatt', condition: propertyData.petsAllowed },
      { key: 'quietArea', label: 'Rolig', condition: propertyData.quietArea },
      { key: 'centralLocation', label: 'Sentralt', condition: propertyData.centralLocation },
      { key: 'hiking', label: 'Turterreng', condition: propertyData.hiking },
      { key: 'viewType', label: propertyData.viewType, condition: !!propertyData.viewType }
    ]
  };

  // Get all active facilities
  const allActiveFacilities = Object.values(facilityCategories)
    .flat()
    .filter(facility => facility.condition)
    .map(facility => facility.label);

  // Add raw facilities that aren't covered by our structured approach
  if (propertyData.rawFacilities) {
    propertyData.rawFacilities.forEach(facility => {
      if (!allActiveFacilities.some(af => af.toLowerCase().includes(facility.toLowerCase()))) {
        allActiveFacilities.push(facility);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Header with title and actions */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{propertyData.title}</h3>
          <p className="text-sm text-muted-foreground">{propertyData.address}</p>
          {cached && (
            <Badge variant="outline" className="mt-1 text-xs">
              Data automatisk hentet fra Finn.no og lagret i 6 måneder
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {onViewOnFinn && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewOnFinn}
              className="text-xs"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Vis på Finn.no
            </Button>
          )}
          {onClearData && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearData}
              className="text-xs"
            >
              Fjern data
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Price Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pris</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Prisantydning</p>
              <p className="text-xl font-bold text-primary">
                {formatNumberWithSpaces(propertyData.price)} kr
              </p>
            </div>
            
            {propertyData.totalPrice && (
              <div>
                <p className="text-xs text-muted-foreground">Totalpris</p>
                <p className="text-sm font-semibold">
                  {formatNumberWithSpaces(propertyData.totalPrice)} kr
                </p>
              </div>
            )}
            
            {propertyData.additionalCosts && (
              <div>
                <p className="text-xs text-muted-foreground">Omkostninger</p>
                <p className="text-sm font-semibold">
                  {formatNumberWithSpaces(propertyData.additionalCosts)} kr
                </p>
              </div>
            )}
            
            {propertyData.propertyValue && (
              <div>
                <p className="text-xs text-muted-foreground">Formuesverdi</p>
                <p className="text-sm font-semibold">
                  {formatNumberWithSpaces(propertyData.propertyValue)} kr
                </p>
              </div>
            )}

            {propertyData.pricePerSqm && (
              <div>
                <p className="text-xs text-muted-foreground">Pris per m²</p>
                <p className="text-sm font-semibold">
                  {formatNumberWithSpaces(propertyData.pricePerSqm)} kr/m²
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Nøkkelinfo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Boligtype</p>
                <p className="font-medium capitalize">{propertyData.propertyType}</p>
              </div>
              
              {propertyData.ownershipType && (
                <div>
                  <p className="text-xs text-muted-foreground">Eieform</p>
                  <p className="font-medium">{propertyData.ownershipType}</p>
                </div>
              )}
              
              <div>
                <p className="text-xs text-muted-foreground">Intern bruksareal</p>
                <p className="font-medium">{propertyData.livingArea} m²</p>
              </div>
              
              {propertyData.totalArea && (
                <div>
                  <p className="text-xs text-muted-foreground">Tomteareal</p>
                  <p className="font-medium">{propertyData.totalArea} m²</p>
                </div>
              )}
              
              {propertyData.balconyArea && (
                <div>
                  <p className="text-xs text-muted-foreground">Balkong/Terrasse</p>
                  <p className="font-medium">{propertyData.balconyArea} m²</p>
                </div>
              )}
              
              {propertyData.bedrooms && (
                <div>
                  <p className="text-xs text-muted-foreground">Soverom</p>
                  <p className="font-medium">{propertyData.bedrooms}</p>
                </div>
              )}
              
              {propertyData.totalRooms && (
                <div>
                  <p className="text-xs text-muted-foreground">Totalt rom</p>
                  <p className="font-medium">{propertyData.totalRooms}</p>
                </div>
              )}
              
              {propertyData.yearBuilt && (
                <div>
                  <p className="text-xs text-muted-foreground">Byggeår</p>
                  <p className="font-medium">{propertyData.yearBuilt}</p>
                </div>
              )}
              
              {propertyData.energyRating && (
                <div>
                  <p className="text-xs text-muted-foreground">Energimerking</p>
                  <p className="font-medium">{propertyData.energyRating}</p>
                </div>
              )}
              
              {propertyData.floor && (
                <div>
                  <p className="text-xs text-muted-foreground">Etasje</p>
                  <p className="font-medium">{propertyData.floor}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Facilities */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Fasiliteter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {allActiveFacilities.map((facility, index) => (
                <Badge
                  key={`${facility}-${index}`}
                  variant="secondary"
                  className="text-xs"
                >
                  {facility}
                </Badge>
              ))}
              {allActiveFacilities.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Ingen fasiliteter registrert
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Costs Section - if available */}
      {(propertyData.municipalFees || 
        propertyData.sharedCosts || 
        propertyData.sharedEquity || 
        propertyData.totalMonthlyCosts) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Månedlige kostnader</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {propertyData.municipalFees && (
                <div>
                  <p className="text-xs text-muted-foreground">Kommunale avg.</p>
                  <p className="font-semibold">{formatNumberWithSpaces(propertyData.municipalFees)} kr/mnd</p>
                </div>
              )}
              
              {propertyData.sharedCosts && (
                <div>
                  <p className="text-xs text-muted-foreground">Felleskost</p>
                  <p className="font-semibold">{formatNumberWithSpaces(propertyData.sharedCosts)} kr/mnd</p>
                </div>
              )}
              
              {propertyData.sharedEquity && (
                <div>
                  <p className="text-xs text-muted-foreground">Fellesformue</p>
                  <p className="font-semibold">{formatNumberWithSpaces(propertyData.sharedEquity)} kr</p>
                </div>
              )}
              
              {propertyData.totalMonthlyCosts && (
                <div>
                  <p className="text-xs text-muted-foreground">Totalt per måned</p>
                  <p className="font-semibold text-primary">{formatNumberWithSpaces(propertyData.totalMonthlyCosts)} kr/mnd</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Information - if available */}
      {(propertyData.agentName || propertyData.agencyName) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Kontaktinformasjon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {propertyData.agentName && (
                <div>
                  <p className="text-xs text-muted-foreground">Megler</p>
                  <p className="font-medium">{propertyData.agentName}</p>
                  {propertyData.agentTitle && (
                    <p className="text-xs text-muted-foreground">{propertyData.agentTitle}</p>
                  )}
                </div>
              )}
              
              {propertyData.agencyName && (
                <div>
                  <p className="text-xs text-muted-foreground">Meglerfirma</p>
                  <p className="font-medium">{propertyData.agencyName}</p>
                </div>
              )}
              
              {propertyData.agentPhone && (
                <div>
                  <p className="text-xs text-muted-foreground">Telefon</p>
                  <p className="font-medium">{propertyData.agentPhone}</p>
                </div>
              )}
              
              {propertyData.agentEmail && (
                <div>
                  <p className="text-xs text-muted-foreground">E-post</p>
                  <p className="font-medium">{propertyData.agentEmail}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};