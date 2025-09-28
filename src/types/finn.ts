export interface FinnPropertyData {
  finnCode: string;
  title: string;
  address: string;
  price: number;
  propertyType: 'leilighet' | 'enebolig' | 'rekkehus' | 'tomannsbolig';
  livingArea: number;
  totalArea?: number;
  bedrooms?: number;
  yearBuilt?: number;
  energyRating?: string;
  description: string;
  images: string[];
  municipalFees?: number;
  sharedCosts?: number;
  monthlyRent?: number;
  parkingSpaces?: number;
  balcony?: boolean;
  elevator?: boolean;
  garage?: boolean;
  garden?: boolean;
  viewType?: string;
  condition?: string;
  heatingType?: string;
  internetIncluded?: boolean;
  petsAllowed?: boolean;
  smokingAllowed?: boolean;
  furnished?: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
  neighborhood?: string;
  pricePerSqm?: number;
  availableFrom?: string;
  depositAmount?: number;
  minRentalPeriod?: number;
}

export interface FinnPropertyResponse {
  success: boolean;
  data?: FinnPropertyData;
  cached?: boolean;
  error?: string;
  message?: string;
}

export interface FinnPropertyCacheEntry {
  id: string;
  finn_code: string;
  property_data: FinnPropertyData;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Mapping from Finn property data to calculator fields
export interface PropertyCalculatorMapping {
  totalPrice: number;
  propertyType: string;
  propertyAddress: string;
  municipalFees?: number;
  // Add other relevant mappings as needed
}