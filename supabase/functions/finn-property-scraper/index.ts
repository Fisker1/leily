import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FinnPropertyData {
  finnCode: string;
  title: string;
  address: string;
  price: number; // Prisantydning
  totalPrice?: number; // Totalpris
  additionalCosts?: number; // Omkostninger
  propertyValue?: number; // Formuesverdi
  propertyType: string;
  livingArea: number;
  totalArea?: number;
  balconyArea?: number; // Balkong/Terrasse area
  bedrooms?: number;
  totalRooms?: number; // Total number of rooms
  floor?: string; // Which floor
  yearBuilt?: number;
  energyRating?: string;
  description: string;
  images: string[];
  municipalFees?: number; // Monthly amount
  sharedCosts?: number;
  sharedEquity?: number; // Fellesformue
  monthlyRent?: number;
  loanCostsFrom?: number; // Pris på lån fra X kr/mnd
  
  // Ownership and legal
  ownershipType?: string; // Eier, Selveier, Andel, etc.
  
  // Property features and facilities
  parkingSpaces?: number;
  balcony?: boolean;
  elevator?: boolean;
  garage?: boolean;
  garden?: boolean; // Hage
  terrace?: boolean; // Balkong/Terrasse
  fireplace?: boolean; // Peis/Ildsted
  basement?: boolean; // Kjeller
  attic?: boolean; // Loft
  viewType?: string;
  condition?: string;
  heatingType?: string;
  internetIncluded?: boolean;
  petsAllowed?: boolean; // Kjæledyr tillatt
  smokingAllowed?: boolean;
  furnished?: boolean;
  childFriendly?: boolean; // Barnevennlig
  quietArea?: boolean; // Rolig
  centralLocation?: boolean; // Sentralt
  publicWaterSewer?: boolean; // Offentlig vann/kloakk
  hiking?: boolean; // Turterreng
  chargingStation?: boolean; // Ladestasjon
  internet?: boolean; // Internett/Fiber
  
  // Location and coordinates
  coordinates?: {
    lat: number;
    lng: number;
  };
  neighborhood?: string;
  pricePerSqm?: number;
  
  // Rental specific
  availableFrom?: string;
  depositAmount?: number;
  minRentalPeriod?: number;
  
  // Agent and viewing information
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  agentTitle?: string; // Partner, Eiendomsmegler, etc.
  agencyName?: string;
  
  // Viewing information
  viewingDates?: Array<{
    date: string;
    timeFrom: string;
    timeTo: string;
    description?: string;
  }>;
  
  // Administrative
  referenceNumber?: string;
  datePublished?: string;
  dateModified?: string;
  
  // Additional building details
  floors?: number; // Antall etasjer
  roomDescription?: string; // Detailed room breakdown
  buildingDescription?: string;
  locationDescription?: string;
  
  // Energy and technical
  energyCertificate?: string;
  waterHeating?: string;
  sewageSystem?: string;
  
  // Calculated fields
  totalMonthlyCosts?: number; // Sum of all monthly costs
  
  // Raw data for future analysis
  rawFacilities?: string[]; // Store all facilities as found in Finn.no for analysis
}

// Use OpenAI to extract structured data from Finn.no HTML - WITH ENHANCED STRUCTURED DATA PARSING
async function extractFinnDataWithAI(finnCode: string, htmlContent: string): Promise<FinnPropertyData | null> {
  try {
    console.log(`Attempting to extract Finn property data for code: ${finnCode}`);
    
    // FIRST: Try to extract structured data from advertising config (most reliable)
    const advertisingConfigMatch = htmlContent.match(/<script id="advertising-initial-state" type="application\/json">(.*?)<\/script>/s);
    if (advertisingConfigMatch) {
      try {
        const advertisingConfig = JSON.parse(advertisingConfigMatch[1]);
        const targeting = advertisingConfig?.config?.adServer?.gam?.targeting || [];
        
        console.log('Found structured advertising data, extracting property info...');
        
        // Extract data from targeting array
        const getTargetValue = (key: string) => {
          const item = targeting.find((t: any) => t.key === key);
          return item?.value?.[0] || null;
        };
        
        const getTargetValues = (key: string) => {
          const item = targeting.find((t: any) => t.key === key);
          return item?.value || [];
        };
        
        // Extract images from targeting
        const imageIds = getTargetValues('images');
        const images = imageIds.map((id: string) => `https://images.finncdn.no/dynamic/1280w/${id}`);
        
        // Map property type from English to Norwegian
        const mapPropertyType = (type: string) => {
          const typeMap: Record<string, string> = {
            'SEMIDETACHED': 'tomannsbolig',
            'DETACHED': 'enebolig',
            'TERRACED': 'rekkehus',
            'APARTMENT': 'leilighet'
          };
          return typeMap[type] || type.toLowerCase();
        };
        
        // Map ownership type to Norwegian
        const mapOwnershipType = (type: string) => {
          const ownershipMap: Record<string, string> = {
            'FREEHOLD': 'selveier',
            'COOPERATIVE': 'andel',
            'SHARE': 'aksje',
            'PART_OWNERSHIP': 'deleie',
            'PARTIAL_OWNERSHIP': 'deleie',
            'OWNERSHIP': 'eier',
            'TENANT_OWNED': 'eierseksjon',
            'CONDOMINIUM': 'eierseksjon',
            'LEASEHOLD': 'festeeiendom',
            'RENT': 'leie'
          };
          
          // Handle common English phrases that might appear
          const lowerType = type.toLowerCase();
          if (lowerType.includes('part') || lowerType.includes('partial')) {
            return 'deleie';
          }
          if (lowerType.includes('cooperative') || lowerType.includes('andel')) {
            return 'andel';
          }
          if (lowerType.includes('freehold') || lowerType.includes('selveier')) {
            return 'selveier';
          }
          if (lowerType.includes('share') || lowerType.includes('aksje')) {
            return 'aksje';
          }
          
          return ownershipMap[type] || type.toLowerCase();
        };
        
        // Parse facilities from structured data - ONLY from dedicated facilities section
        const facilities = getTargetValues('facilities');
        console.log('Raw facilities extracted from advertising config:', facilities);
        
        // Extract facilities from HTML only from the specific "Fasiliteter" section
        let htmlFacilities: string[] = [];
        if (!facilities || facilities.length === 0) {
          console.log('No facilities in structured data, extracting from HTML Fasiliteter section');
          htmlFacilities = extractFacilitiesFromFasilitetSection(htmlContent);
        }
        
        // Extract title and address properly - address should be from structured data or HTML fallback
        let propertyTitle = advertisingConfig?.config?.pageTitle || `Eiendom ${finnCode}`;
        let propertyAddress = getTargetValue('street_address') || getTargetValue('address') || getTargetValue('location') || 'Adresse ikke tilgjengelig';
        
        // If we didn't find a proper address in structured data, try to extract from HTML
        if (propertyAddress === 'Adresse ikke tilgjengelig' || !propertyAddress.includes(',')) {
          const addressFromHTML = extractAddressFromHTML(htmlContent);
          if (addressFromHTML) {
            propertyAddress = addressFromHTML;
          }
        }
        
        // Extract comprehensive property data
        const propertyData: FinnPropertyData = {
          finnCode: finnCode,
          title: propertyTitle,
          address: propertyAddress,
          
          // Pricing information - store all available pricing data
          price: parseInt(getTargetValue('price')) || 0,
          totalPrice: undefined, // Will be extracted from HTML if available
          additionalCosts: undefined,
          propertyValue: undefined,
          
          // Property classification
          propertyType: mapPropertyType(getTargetValue('property_type') || ''),
          ownershipType: mapOwnershipType(getTargetValue('ownership_type') || ''),
          
          // Area measurements - capture all available area data
          livingArea: parseInt(getTargetValue('primary_size')) || 0,
          totalArea: parseInt(getTargetValue('plot_area')) || undefined,
          balconyArea: parseInt(getTargetValue('open_area_size')) || undefined,
          
          // Room information
          bedrooms: parseInt(getTargetValue('bedrooms')) || undefined,
          totalRooms: parseInt(getTargetValue('rooms')) || undefined,
          floor: getTargetValue('floor') || undefined,
          
          // Building details
          yearBuilt: parseInt(getTargetValue('construction_year')) || undefined,
          energyRating: undefined, // Will extract from HTML if available
          
          description: `Eiendom i ${getTargetValue('local_area_name') || 'Norge'}`,
          images: images,
          
          // Monthly costs - will be extracted from HTML parsing
          municipalFees: undefined,
          sharedCosts: undefined,
          sharedEquity: undefined,
          monthlyRent: undefined,
          loanCostsFrom: undefined,
          
          // Property features - comprehensive facility parsing
          parkingSpaces: facilities.some((f: string) => f.includes('Garasje') || f.includes('P-plass')) ? 1 : undefined,
          balcony: facilities.some((f: string) => f.includes('Balkong') || f.includes('Terrasse')),
          elevator: facilities.some((f: string) => f.includes('Heis')),
          garage: facilities.some((f: string) => f.includes('Garasje')),
          garden: facilities.some((f: string) => f.includes('Hage')),
          terrace: facilities.some((f: string) => f.includes('Terrasse')),
          fireplace: facilities.some((f: string) => f.includes('Peis') || f.includes('Ildsted')),
          basement: facilities.some((f: string) => f.includes('Kjeller')),
          attic: facilities.some((f: string) => f.includes('Loft')),
          viewType: facilities.some((f: string) => f.includes('Utsikt')) ? 'Utsikt' : undefined,
          condition: facilities.some((f: string) => f.includes('Moderne')) ? 'Moderne' : undefined,
          heatingType: facilities.some((f: string) => f.includes('Varmepumpe')) ? 'Varmepumpe' : undefined,
          internetIncluded: facilities.some((f: string) => f.includes('Bredbånd') || f.includes('Fiber')),
          petsAllowed: facilities.some((f: string) => f.includes('Kjæledyr')),
          smokingAllowed: undefined,
          furnished: facilities.some((f: string) => f.includes('Møblert')),
          childFriendly: facilities.some((f: string) => f.includes('Barnevennlig')),
          quietArea: facilities.some((f: string) => f.includes('Rolig')),
          centralLocation: facilities.some((f: string) => f.includes('Sentralt')),
          publicWaterSewer: facilities.some((f: string) => f.includes('Offentlig vann') || f.includes('kloakk')),
          hiking: facilities.some((f: string) => f.includes('Turterreng')),
          chargingStation: facilities.some((f: string) => f.includes('Ladestasjon') || f.includes('Lademulighet')),
          internet: facilities.some((f: string) => f.includes('Bredbånd') || f.includes('Fiber')),
          
          // Store raw facilities array for future analysis - use structured data or targeted HTML extraction
          rawFacilities: facilities.length > 0 ? facilities : htmlFacilities,
          
          coordinates: undefined,
          neighborhood: getTargetValue('local_area_name'),
          pricePerSqm: undefined,
          
          // Additional building details
          floors: undefined,
          roomDescription: undefined,
          buildingDescription: undefined,
          locationDescription: undefined,
          
          // Agent information - will be extracted if available
          agentName: undefined,
          agentPhone: undefined,
          agentEmail: undefined,
          agentTitle: undefined,
          agencyName: undefined,
          
          // Administrative
          referenceNumber: finnCode,
          datePublished: undefined,
          dateModified: undefined,
          
          // Energy and technical
          energyCertificate: undefined,
          waterHeating: undefined,
          sewageSystem: undefined
        };
        
        // Calculate price per sqm if we have both values
        if (propertyData.price > 0 && propertyData.livingArea > 0) {
          propertyData.pricePerSqm = Math.round(propertyData.price / propertyData.livingArea);
        }
        
        // DOUBLE-CHECK: If no facilities from structured data, use HTML extraction from Fasiliteter section only
        if (!propertyData.rawFacilities || propertyData.rawFacilities.length === 0) {
          console.log('No facilities from structured data, using targeted HTML extraction from Fasiliteter section...');
          propertyData.rawFacilities = htmlFacilities;
          // Update boolean flags based on specifically extracted facilities
          updateFacilityFlags(propertyData, htmlFacilities);
          console.log('Successfully extracted facilities from Fasiliteter section:', htmlFacilities);
        } else {
          // Use structured data and update flags
          updateFacilityFlags(propertyData, facilities);
        }
        
        console.log('Successfully extracted property data from structured advertising config:', {
          finnCode: propertyData.finnCode,
          title: propertyData.title,
          price: propertyData.price,
          address: propertyData.address,
          propertyType: propertyData.propertyType,
          livingArea: propertyData.livingArea,
          totalArea: propertyData.totalArea,
          bedrooms: propertyData.bedrooms,
          totalRooms: propertyData.totalRooms,
          yearBuilt: propertyData.yearBuilt,
          rawFacilities: propertyData.rawFacilities,
          extractedFeatureCount: propertyData.rawFacilities?.length || 0
        });
        
        return propertyData;
        
      } catch (error) {
        console.error('Error parsing structured advertising data:', error);
        // Fall through to HTML parsing
      }
    }
    
    // FALLBACK: Try to extract from JSON-LD structured data
    const jsonLdMatches = htmlContent.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis);
    if (jsonLdMatches) {
      try {
        for (const match of jsonLdMatches) {
          const jsonContent = match.replace(/<script[^>]*type="application\/ld\+json"[^>]*>/, '').replace(/<\/script>/, '');
          const structuredData = JSON.parse(jsonContent);
          
          if (structuredData['@type'] === 'Product' || structuredData['@type'] === 'RealEstate') {
            console.log('Found JSON-LD structured data for property');
            
            const propertyData: FinnPropertyData = {
              finnCode: finnCode,
              title: structuredData.name || `Eiendom ${finnCode}`,
              address: structuredData.address?.streetAddress || 'Adresse ikke tilgjengelig',
              price: structuredData.offers?.price ? parseInt(structuredData.offers.price) : 0,
              propertyType: 'leilighet', // Default, will be refined by AI if needed
              livingArea: 0, // Will be refined by AI
              description: structuredData.description || '',
              images: Array.isArray(structuredData.image) ? structuredData.image : (structuredData.image ? [structuredData.image] : []),
              coordinates: undefined,
              balcony: false,
              elevator: false,
              garage: false,
              garden: false,
              terrace: false,
              fireplace: false,
              basement: false,
              attic: false,
              petsAllowed: false,
              childFriendly: false,
              quietArea: false,
              centralLocation: false,
              publicWaterSewer: false,
              hiking: false,
              chargingStation: false,
              internet: false
            };
            
            console.log('Successfully extracted property data from JSON-LD:', {
              finnCode: propertyData.finnCode,
              title: propertyData.title,
              price: propertyData.price,
              address: propertyData.address
            });
            
            return propertyData;
          }
        }
      } catch (error) {
        console.error('Error parsing JSON-LD data:', error);
      }
    }
    
    // If no structured data found, return a basic fallback
    console.log('No structured data found, creating fallback data');
    return {
      finnCode: finnCode,
      title: `Eiendom ${finnCode}`,
      address: 'Adresse ikke tilgjengelig',
      price: 0,
      propertyType: 'leilighet',
      livingArea: 0,
      description: 'Ingen detaljert beskrivelse tilgjengelig',
      images: [],
      coordinates: undefined,
      balcony: false,
      elevator: false,
      garage: false,
      garden: false,
      terrace: false,
      fireplace: false,
      basement: false,
      attic: false,
      petsAllowed: false,
      childFriendly: false,
      quietArea: false,
      centralLocation: false,
      publicWaterSewer: false,
      hiking: false,
      chargingStation: false,
      internet: false
    };

  } catch (error) {
    console.error('Error extracting Finn property data:', error);
    return null;
  }
}

// Enhanced HTML preprocessing to highlight key data sections with better pattern matching
function preprocessHtmlForPricing(html: string): string {
  console.log('Preprocessing HTML for better AI extraction...');
  
  let processedHtml = html;
  
  // 1. Mark ALL numeric values followed by "kr" with special markers
  processedHtml = processedHtml.replace(
    /(\d{1,3}(?:\s\d{3})*)\s*kr(?!\w)/gi, 
    '\n===CURRENCY_VALUE=== $1 kr ===CURRENCY_VALUE===\n'
  );
  
  // 2. Mark specific price-related terms with their contexts
  processedHtml = processedHtml.replace(
    /(prisantydning|totalpris|omkostninger|formuesverdi|felleskost|kommunale\s+avg)[^<>]*?(\d[\d\s]*)\s*kr/gi,
    '\n===PRICE_SECTION=== $1: $2 kr ===PRICE_SECTION===\n'
  );
  
  // 3. Mark area measurements with enhanced detection
  processedHtml = processedHtml.replace(
    /(\d+)\s*m²(?:\s*\([^)]*\))?/gi,
    '\n===AREA_MEASUREMENT=== $1 m² ===AREA_MEASUREMENT===\n'
  );
  
  // 4. Mark specific area types from Nøkkelinfo section
  processedHtml = processedHtml.replace(
    /(intern\s+bruksareal|bruksareal|boligareal|ekstern\s+bruksareal|tomteareal)[^<>]*?(\d+)\s*m²/gi,
    '\n===SPECIFIC_AREA=== $1: $2 m² ===SPECIFIC_AREA===\n'
  );
  
  // 5. Mark room count information
  processedHtml = processedHtml.replace(
    /(soverom|antall\s+rom)[^<>]*?(\d+)/gi,
    '\n===ROOM_INFO=== $1: $2 ===ROOM_INFO===\n'
  );
  
  // 6. Mark building year information
  processedHtml = processedHtml.replace(
    /(byggeår|bygget)[^<>]*?(19\d{2}|20\d{2})/gi,
    '\n===YEAR_INFO=== $1: $2 ===YEAR_INFO===\n'
  );
  
  // 7. Mark property type information
  processedHtml = processedHtml.replace(
    /(boligtype|eieform)[^<>]*?(leilighet|enebolig|rekkehus|tomannsbolig|eier|selveier|andel|aksje)/gi,
    '\n===PROPERTY_TYPE=== $1: $2 ===PROPERTY_TYPE===\n'
  );
  
  // 8. Highlight table rows and data structures that might contain key info
  processedHtml = processedHtml.replace(
    /<tr[^>]*>[\s\S]*?<\/tr>/gi,
    '\n===TABLE_ROW_START===\n$&\n===TABLE_ROW_END===\n'
  );
  
  // 9. Highlight definition lists which are common in property descriptions
  processedHtml = processedHtml.replace(
    /<dl[^>]*>[\s\S]*?<\/dl>/gi,
    '\n===DEFINITION_LIST_START===\n$&\n===DEFINITION_LIST_END===\n'
  );
  
  // 10. Mark structured sections that might contain nøkkelinfo
  processedHtml = processedHtml.replace(
    /(nøkkelinfo|key\s*info|property\s*details)[\s\S]{0,100}?/gi,
    '\n===KEY_INFO_SECTION_START===\n$&\n===KEY_INFO_SECTION_END===\n'
  );
  
  return processedHtml;
}

// Extract address from HTML when structured data doesn't have the full address
function extractAddressFromHTML(htmlContent: string): string | null {
  // Look for address patterns in HTML - typically in blue links or specific containers
  const addressPatterns = [
    // Look for blue links that typically contain addresses
    /<a[^>]*class="[^"]*text-blue[^"]*"[^>]*>([^<]*\d+[^<]*,\s*\d{4}\s*[^<]*)<\/a>/gi,
    /<a[^>]*href="[^"]*"[^>]*>([^<]*\d+[A-Za-z]?,\s*\d{4}\s*[^<]*)<\/a>/gi,
    
    // Look for address in structured sections
    /<div[^>]*class="[^"]*address[^"]*"[^>]*>([^<]*\d+[^<]*,\s*\d{4}\s*[^<]*)<\/div>/gi,
    /<span[^>]*class="[^"]*location[^"]*"[^>]*>([^<]*\d+[^<]*,\s*\d{4}\s*[^<]*)<\/span>/gi,
    
    // Generic pattern for Norwegian addresses (street number, postal code city)
    />([A-Za-zæøåÆØÅ\s]+\d+[A-Za-z]?,\s*\d{4}\s*[A-Za-zæøåÆØÅ\s]+)</gi
  ];
  
  for (const pattern of addressPatterns) {
    const matches = htmlContent.match(pattern);
    if (matches && matches.length > 0) {
      for (const match of matches) {
        // Extract the address from the match
        const addressMatch = match.match(/([A-Za-zæøåÆØÅ\s]+\d+[A-Za-z]?,\s*\d{4}\s*[A-Za-zæøåÆØÅ\s]+)/);
        if (addressMatch) {
          const address = addressMatch[1].trim();
          // Validate that this looks like a real address
          if (address.length > 10 && address.includes(',')) {
            console.log(`Extracted address from HTML: ${address}`);
            return address;
          }
        }
      }
    }
  }
  
  console.log('Could not extract address from HTML');
  return null;
}

// Extract facilities ONLY from the dedicated "Fasiliteter" section of the HTML
function extractFacilitiesFromFasilitetSection(htmlContent: string): string[] {
  const facilities: string[] = [];
  
  // Look specifically for the "Fasiliteter" section and extract items only from there
  const fasilitetPatterns = [
    // Match the "Fasiliteter" heading followed by the facility list
    /<h[1-6][^>]*>Fasiliteter<\/h[1-6]>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/gi,
    /<h[1-6][^>]*>Facilities<\/h[1-6]>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/gi,
    
    // Match divs or sections with "Fasiliteter" class or heading
    /<div[^>]*class="[^"]*facilit[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<section[^>]*>[\s\S]*?<h[1-6][^>]*>Fasiliteter<\/h[1-6]>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>[\s\S]*?<\/section>/gi
  ];
  
  for (const pattern of fasilitetPatterns) {
    const matches = htmlContent.match(pattern);
    if (matches) {
      for (const match of matches) {
        // Extract list items from the matched section
        const listItemPattern = /<li[^>]*>([^<]+)<\/li>/gi;
        let listItemMatch;
        
        while ((listItemMatch = listItemPattern.exec(match)) !== null) {
          const facilityText = listItemMatch[1].trim();
          
          // Only add if it looks like a real facility (not too long, not empty)
          if (facilityText.length > 2 && facilityText.length < 50) {
            // Clean up the text
            const cleanedFacility = facilityText
              .replace(/^\s*[•·\-\*]\s*/, '') // Remove bullet points
              .trim();
            
            if (cleanedFacility && !facilities.includes(cleanedFacility)) {
              facilities.push(cleanedFacility);
            }
          }
        }
      }
    }
  }
  
  console.log('Facilities extracted from Fasiliteter section:', facilities);
  return facilities;
}

// Extract facilities from HTML content when structured data is not available
function extractFacilitiesFromHTML(htmlContent: string): string[] {
  const facilities: string[] = [];
  
  // Look for common facility patterns in HTML
  const facilityPatterns = [
    // Look for facilities in structured sections
    /<div[^>]*class="[^"]*facilit[^"]*"[^>]*>(.*?)<\/div>/gis,
    /<section[^>]*>(.*?fasiliteter.*?)<\/section>/gis,
    /<ul[^>]*>(.*?fasiliteter.*?)<\/ul>/gis,
    
    // Look for badge-like elements that might contain facilities
    /<span[^>]*class="[^"]*badge[^"]*"[^>]*>([^<]+)<\/span>/gi,
    /<div[^>]*class="[^"]*tag[^"]*"[^>]*>([^<]+)<\/div>/gi,
    
    // Look for list items that might be facilities
    /<li[^>]*>([^<]*(?:balkong|terrasse|peis|heis|garasje|hage|lademulighet|bredbånd|fiber|kjæledyr|barnevennlig|rolig|sentralt|turterreng|utsikt|moderne|parkett|offentlig vann|kloakk)[^<]*)<\/li>/gi
  ];
  
  for (const pattern of facilityPatterns) {
    const matches = htmlContent.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Clean up and extract facility names
        const cleaned = match.replace(/<[^>]*>/g, ' ').trim();
        const words = cleaned.split(/\s+/).filter(word => word.length > 2);
        
        // Look for known facility keywords
        const facilityKeywords = [
          'balkong', 'terrasse', 'peis', 'ildsted', 'heis', 'garasje', 'p-plass',
          'hage', 'lademulighet', 'bredbånd', 'fiber', 'kjæledyr', 'barnevennlig',
          'rolig', 'sentralt', 'turterreng', 'utsikt', 'moderne', 'parkett',
          'offentlig vann', 'kloakk', 'kjeller', 'loft', 'utvidelsesmuligheter'
        ];
        
        facilityKeywords.forEach(keyword => {
          if (cleaned.toLowerCase().includes(keyword) && !facilities.some(f => f.toLowerCase().includes(keyword))) {
            // Try to extract the full facility name around the keyword
            const regex = new RegExp(`[^.,]*${keyword}[^.,]*`, 'i');
            const facilityMatch = cleaned.match(regex);
            if (facilityMatch) {
              facilities.push(facilityMatch[0].trim());
            }
          }
        });
      });
    }
  }
  
  // Remove duplicates and clean up
  return [...new Set(facilities)].filter(f => f.length > 2 && f.length < 100);
}

// Update facility boolean flags based on extracted facilities
function updateFacilityFlags(propertyData: FinnPropertyData, facilities: string[]): void {
  const facilitiesText = facilities.join(' ').toLowerCase();
  
  propertyData.balcony = facilitiesText.includes('balkong');
  propertyData.terrace = facilitiesText.includes('terrasse');
  propertyData.fireplace = facilitiesText.includes('peis') || facilitiesText.includes('ildsted');
  propertyData.elevator = facilitiesText.includes('heis');
  propertyData.garage = facilitiesText.includes('garasje') || facilitiesText.includes('p-plass');
  propertyData.garden = facilitiesText.includes('hage');
  propertyData.chargingStation = facilitiesText.includes('lademulighet') || facilitiesText.includes('ladestasjon');
  propertyData.internet = facilitiesText.includes('bredbånd') || facilitiesText.includes('fiber');
  propertyData.internetIncluded = facilitiesText.includes('bredbånd') || facilitiesText.includes('fiber');
  propertyData.petsAllowed = facilitiesText.includes('kjæledyr');
  propertyData.childFriendly = facilitiesText.includes('barnevennlig');
  propertyData.quietArea = facilitiesText.includes('rolig');
  propertyData.centralLocation = facilitiesText.includes('sentralt');
  propertyData.hiking = facilitiesText.includes('turterreng');
  propertyData.basement = facilitiesText.includes('kjeller');
  propertyData.attic = facilitiesText.includes('loft');
  propertyData.publicWaterSewer = facilitiesText.includes('offentlig vann') || facilitiesText.includes('kloakk');
  
  if (facilitiesText.includes('utsikt')) {
    propertyData.viewType = 'Utsikt';
  }
  if (facilitiesText.includes('moderne')) {
    propertyData.condition = 'Moderne';
  }
  if (facilitiesText.includes('varmepumpe')) {
    propertyData.heatingType = 'Varmepumpe';
  }
}

// Improved scraping with better headers and error handling
async function scrapeFinnPropertyHTML(finnCode: string): Promise<string | null> {
  try {
    const url = `https://www.finn.no/realestate/homes/ad.html?finnkode=${finnCode}`;
    console.log(`Scraping Finn property HTML: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'no-NO,no;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      }
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    console.log(`Successfully fetched HTML, length: ${html.length} characters`);
    
    return html;

  } catch (error) {
    console.error('Error scraping Finn property HTML:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔐 Authenticating user...');
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('❌ No Authorization header');
      return new Response(JSON.stringify({
        success: false,
        message: 'Ingen autorisasjon. Logg inn for å bruke denne funksjonen.'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.log('❌ Authentication failed:', authError);
      return new Response(JSON.stringify({
        success: false,
        message: 'Autentisering feilet. Logg inn på nytt.'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ User authenticated:', user.id);

    const { finnCode } = await req.json();
    console.log('📋 Finn code received:', finnCode);

    if (!finnCode) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Finn-kode mangler. Vennligst oppgi en gyldig Finn-kode.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // STEP 1: Check cache first (6 months TTL) - FREE for all authenticated users
    console.log('🔍 Checking cache for Finn code:', finnCode);
    const { data: cachedData, error: cacheError } = await supabaseClient
      .from('finn_property_cache')
      .select('*')
      .eq('finn_code', finnCode)
      .gte('expires_at', new Date().toISOString())
      .maybeSingle();

    if (cachedData && !cacheError) {
      console.log('✅ Cache HIT! Returning cached data - FREE');
      return new Response(JSON.stringify({
        success: true,
        data: cachedData.property_data,
        cached: true,
        cachedAt: cachedData.extracted_at,
        message: 'Data hentet fra cache (gratis)'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('❌ Cache MISS - New fetch required (1 credit)');

    // STEP 2: Check if user has credits
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.credits || 0) < 1) {
      console.log('❌ User has insufficient credits:', profile?.credits || 0);
      return new Response(JSON.stringify({
        success: false,
        message: 'Ingen kreditter tilgjengelig. Du trenger 1 kreditt for å hente ny eiendom. Kjøp kreditter for å fortsette.',
        creditsRequired: 1,
        creditsAvailable: profile?.credits || 0
      }), {
        status: 402, // Payment Required
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // STEP 3: Deduct 1 credit using RPC function
    console.log('💳 Deducting 1 credit from user...');
    const { data: creditUsed, error: creditError } = await supabaseClient
      .rpc('use_credits', {
        credits_to_use: 1,
        operation_type: 'finn_property_fetch'
      });

    if (creditError || !creditUsed) {
      console.log('❌ Failed to deduct credit:', creditError);
      return new Response(JSON.stringify({
        success: false,
        message: 'Kunne ikke trekke kreditt. Prøv igjen senere.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Credit deducted successfully');

    // STEP 4: Scrape the property from Finn.no
    console.log('🌐 Scraping Finn.no property...');
    const htmlContent = await scrapeFinnPropertyHTML(finnCode);
    console.log('✅ HTML content fetched, length:', htmlContent.length);

    console.log('🤖 Extracting property data with AI...');
    const propertyData = await extractFinnDataWithAI(htmlContent, finnCode);
    console.log('✅ Property data extracted');

    // STEP 5: Enhance data with market analysis and cost estimations
    console.log('📊 Enhancing data with market analysis and cost estimates...');
    
    // 5a. Get estimated monthly rent from market-analysis
    let estimatedMonthlyRent = 0;
    try {
      console.log('🏠 Calling market-analysis edge function...');
      const { data: marketData, error: marketError } = await supabaseClient.functions.invoke('market-analysis', {
        body: {
          address: propertyData.address,
          city: propertyData.city,
          postal_code: propertyData.postalCode,
          property_type: propertyData.propertyType,
          size_sqm: propertyData.livingArea
        }
      });

      if (marketError) {
        console.log('⚠️ Market analysis error:', marketError);
      } else {
        estimatedMonthlyRent = marketData?.averageRent || 0;
        console.log('✅ Estimated monthly rent:', estimatedMonthlyRent);
      }
    } catch (error) {
      console.log('⚠️ Market analysis failed:', error);
    }

    // 5b. Get estimated electricity cost
    let estimatedElectricity = 0;
    try {
      console.log('⚡ Calling estimate-electricity edge function...');
      const { data: electricityData, error: electricityError } = await supabaseClient.functions.invoke('estimate-electricity', {
        body: {
          size_sqm: propertyData.livingArea,
          bedrooms: propertyData.bedrooms,
          property_type: propertyData.propertyType,
          location: propertyData.city
        }
      });

      if (electricityError) {
        console.log('⚠️ Electricity estimation error:', electricityError);
      } else {
        estimatedElectricity = electricityData?.estimated_monthly_cost || 0;
        console.log('✅ Estimated electricity:', estimatedElectricity);
      }
    } catch (error) {
      console.log('⚠️ Electricity estimation failed:', error);
    }

    // 5c. Calculate insurance (0.2% of property value per year)
    const calculateInsurance = (propertyValue: number, propertyType: string): number => {
      const baseRate = 0.002; // 0.2% per year
      const yearlyInsurance = propertyValue * baseRate;
      
      const typeMultipliers: { [key: string]: number } = {
        'Leilighet': 0.8,
        'Enebolig': 1.2,
        'Rekkehus': 1.0,
        'Tomannsbolig': 1.1,
      };
      
      const multiplier = typeMultipliers[propertyType] || 1.0;
      return Math.round((yearlyInsurance * multiplier) / 12);
    };

    // 5d. Calculate maintenance (0.7% of property value per year)
    const calculateMaintenance = (propertyValue: number, propertyType: string): number => {
      const maintenanceRate = 0.007; // 0.7% per year
      const yearlyMaintenance = propertyValue * maintenanceRate;
      
      const typeMultipliers: { [key: string]: number } = {
        'Leilighet': 0.5,
        'Enebolig': 1.2,
        'Rekkehus': 0.8,
        'Tomannsbolig': 1.0,
      };
      
      const multiplier = typeMultipliers[propertyType] || 1.0;
      return Math.round((yearlyMaintenance * multiplier) / 12);
    };

    const estimatedInsurance = calculateInsurance(propertyData.price, propertyData.propertyType);
    const estimatedMaintenance = calculateMaintenance(propertyData.price, propertyData.propertyType);

    console.log('💰 Cost estimates calculated:');
    console.log(`  - Insurance: ${estimatedInsurance} NOK/month`);
    console.log(`  - Maintenance: ${estimatedMaintenance} NOK/month`);

    // 5e. Calculate total monthly costs and cash flow
    const totalMonthlyCosts = estimatedElectricity + estimatedInsurance + estimatedMaintenance + (propertyData.municipalFees || 0);
    const monthlyCashFlow = estimatedMonthlyRent - totalMonthlyCosts;
    const grossYield = propertyData.price > 0 ? ((estimatedMonthlyRent * 12) / propertyData.price) * 100 : 0;

    // 5f. Create enhanced response with all estimates
    const enhancedPropertyData = {
      ...propertyData,
      estimates: {
        monthlyRent: estimatedMonthlyRent,
        electricityCost: estimatedElectricity,
        insurance: estimatedInsurance,
        maintenance: estimatedMaintenance,
        municipalFees: propertyData.municipalFees || 0,
        totalMonthlyCosts: totalMonthlyCosts,
        monthlyCashFlow: monthlyCashFlow,
        grossYield: grossYield
      }
    };

    console.log('✅ Enhanced property data created');

    // STEP 6: Cache the result with 6-month expiration
    console.log('💾 Caching enhanced property data...');
    const { error: cacheInsertError } = await supabaseClient
      .from('finn_property_cache')
      .upsert({
        finn_code: finnCode,
        property_data: enhancedPropertyData,
        extracted_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString() // 6 months
      });

    if (cacheInsertError) {
      console.log('⚠️ Failed to cache data:', cacheInsertError);
    } else {
      console.log('✅ Enhanced data cached successfully for 6 months');
    }

    return new Response(JSON.stringify({
      success: true,
      data: enhancedPropertyData,
      cached: false,
      message: '1 kreditt brukt. Data vil være tilgjengelig gratis i 6 måneder.'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in finn-property-scraper:', error);
    
    // Handle specific error types with appropriate messages
    if (error instanceof Error) {
      if (error.message.includes('OpenAI API quota exceeded')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'OpenAI API quota exceeded. Please try again later or contact support.' 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (error.message.includes('OpenAI API authentication failed')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'OpenAI API authentication failed. Please contact support.' 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (error.message.includes('OpenAI API error')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'OpenAI API error. Please try again later.' 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (error.message.includes('Unauthorized')) {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized access' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Property not found or could not be processed' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});