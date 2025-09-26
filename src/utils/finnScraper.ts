import { FinnPropertyData } from '@/types/finn';

// Simple utility to extract property data from Finn.no URLs
// This is a client-side utility for demonstration - in production you'd use the edge function

export interface FinnScrapingResult {
  success: boolean;
  data?: FinnPropertyData;
  error?: string;
}

// Helper function to extract numeric value from text
function extractNumber(text: string): number {
  const match = text.replace(/\s/g, '').match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}

// Helper function to clean and extract price
function extractPrice(text: string): number {
  const cleanText = text.replace(/[^\d]/g, '');
  return parseInt(cleanText) || 0;
}

// Mock function that simulates scraping Finn.no data
// In production, this would be handled by the Supabase edge function
export async function mockFinnPropertyData(finnCode: string): Promise<FinnScrapingResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock data based on common Finn.no property patterns
  const mockData: FinnPropertyData = {
    finnCode: finnCode,
    title: `Moderne 3-roms leilighet i Oslo sentrum`,
    address: `Karl Johans gate 1, 0154 Oslo`,
    price: 4500000,
    propertyType: 'leilighet',
    livingArea: 85,
    totalArea: 85,
    bedrooms: 2,
    yearBuilt: 2018,
    energyRating: 'B',
    description: `Flott 3-roms leilighet med høy standard og sentral beliggenhet. Åpen løsning mellom kjøkken og stue, moderne bad og god planløsning. Kort vei til kollektivtransport og alle fasiliteter i sentrum.`,
    images: [
      'https://images.finncdn.no/dynamic/1280w/2023/11/vertical-0/01/1/123/456/789_123456789.jpg',
      'https://images.finncdn.no/dynamic/1280w/2023/11/vertical-0/01/2/123/456/789_123456789.jpg'
    ],
    municipalFees: 1200,
    sharedCosts: 2500,
    coordinates: {
      lat: 59.9139,
      lng: 10.7522
    }
  };

  // Simulate different property types based on Finn code
  const lastDigit = parseInt(finnCode.slice(-1));
  
  if (lastDigit % 4 === 0) {
    mockData.propertyType = 'enebolig';
    mockData.title = 'Koselig enebolig med stor hage';
    mockData.price = 6200000;
    mockData.livingArea = 150;
    mockData.bedrooms = 4;
    mockData.municipalFees = 2000;
    mockData.sharedCosts = 0;
  } else if (lastDigit % 4 === 1) {
    mockData.propertyType = 'rekkehus';
    mockData.title = 'Moderne rekkehus i familievennlig område';
    mockData.price = 5100000;
    mockData.livingArea = 120;
    mockData.bedrooms = 3;
    mockData.municipalFees = 1500;
    mockData.sharedCosts = 800;
  } else if (lastDigit % 4 === 2) {
    mockData.propertyType = 'tomannsbolig';
    mockData.title = 'Tomannsbolig med potensial for utleie';
    mockData.price = 7500000;
    mockData.livingArea = 180;
    mockData.bedrooms = 5;
    mockData.municipalFees = 2200;
    mockData.sharedCosts = 1000;
  }

  // Simulate occasional failures
  if (finnCode === '00000000') {
    return {
      success: false,
      error: 'Fant ikke eiendom med denne Finn-koden'
    };
  }

  return {
    success: true,
    data: mockData
  };
}

// Function to validate Finn code format
export function validateFinnCode(code: string): boolean {
  return /^\d{8,9}$/.test(code.trim());
}

// Function to extract Finn code from URL
export function extractFinnCodeFromUrl(url: string): string | null {
  const match = url.match(/finn\.no\/realestate\/homes\/ad\/(\d+)/);
  return match ? match[1] : null;
}