import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Property {
  id: string;
  address: string;
  city?: string;
  postal_code?: string;
  property_type?: string;
  monthly_rent?: number;
  current_value?: number;
  show_in_rental?: boolean;
  owner_id: string;
  coordinates?: [number, number];
}

export interface CalculationProperty {
  id: string;
  property_address: string | null;
  finn_code: string | null;
  calculation_data: any;
  results_data: any;
  coordinates?: [number, number];
}

// Global cache for geocoding results
const geocodeCache = new Map<string, [number, number] | null>();
let geocodingQueue: Array<{ resolve: (value: [number, number] | null) => void; address: string }> = [];
let isProcessingQueue = false;

const processGeocodingQueue = async () => {
  if (isProcessingQueue || geocodingQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  // Try to get Mapbox token first for better geocoding accuracy
  let mapboxToken = null;
  try {
    const { data } = await supabase.functions.invoke('get-mapbox-token');
    if (data?.token) {
      mapboxToken = data.token;
      console.log('🔑 Using Mapbox for geocoding');
    }
  } catch (error) {
    console.log('⚠️ Falling back to Nominatim for geocoding');
  }
  
  while (geocodingQueue.length > 0) {
    const { resolve, address } = geocodingQueue.shift()!;
    
    if (geocodeCache.has(address)) {
      resolve(geocodeCache.get(address) || null);
      continue;
    }
    
    try {
      let coords = null;
      
      // Try Mapbox first if token is available
      if (mapboxToken) {
        try {
          const encodedAddress = encodeURIComponent(address);
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&country=NO&limit=1`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.features && data.features.length > 0) {
              const [lng, lat] = data.features[0].center;
              coords = [lng, lat] as [number, number];
              console.log(`✅ Mapbox geocoded "${address}":`, coords);
            }
          }
        } catch (mapboxError) {
          console.warn('Mapbox geocoding failed, trying Nominatim:', mapboxError);
        }
      }
      
      // Fallback to Nominatim if Mapbox failed or unavailable
      if (!coords) {
        const encodedAddress = encodeURIComponent(address);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=no`,
          {
            headers: {
              'User-Agent': 'Leily Property App'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            coords = [parseFloat(data[0].lon), parseFloat(data[0].lat)] as [number, number];
            console.log(`✅ Nominatim geocoded "${address}":`, coords);
          } else {
            console.warn(`❌ No results found for "${address}"`);
          }
        }
      }
      
      geocodeCache.set(address, coords);
      resolve(coords);
      
      // Rate limiting - wait 300ms between requests
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('Geocoding error for', address, ':', error);
      geocodeCache.set(address, null);
      resolve(null);
    }
  }
  
  isProcessingQueue = false;
};

const geocodeAddress = async (address: string, city?: string, postalCode?: string): Promise<[number, number] | null> => {
  const fullAddress = `${address}${city ? `, ${city}` : ''}${postalCode ? `, ${postalCode}` : ''}, Norge`;
  
  if (geocodeCache.has(fullAddress)) {
    return geocodeCache.get(fullAddress) || null;
  }
  
  return new Promise((resolve) => {
    geocodingQueue.push({ resolve, address: fullAddress });
    processGeocodingQueue();
  });
};

export const useOptimizedPropertyData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [calculationProperties, setCalculationProperties] = useState<CalculationProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const fetchUserProperties = useCallback(async (forceRefresh = false) => {
    if (!user) return;

    // Prevent excessive API calls - minimum 10 seconds between fetches unless forced
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime < 10000) {
      console.log('Skipping property fetch - too recent');
      return;
    }
    setLastFetchTime(now);

    console.log('Fetching user properties...');
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id);

      if (error) throw error;
      console.log('Properties fetched:', data?.length || 0);

      // Only geocode properties that don't have coordinates yet
      const propertiesWithCoordinates = await Promise.all(
        (data || []).map(async (property: any) => {
          // Use existing coordinates from database if available and valid
          if (property.coordinates && Array.isArray(property.coordinates) && property.coordinates.length === 2) {
            const [lng, lat] = property.coordinates;
            if (typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat)) {
              console.log(`Using existing coordinates for ${property.address}:`, property.coordinates);
              return { ...property, coordinates: property.coordinates as [number, number] };
            }
          }
          
          console.log(`Geocoding ${property.address}...`);
          // Otherwise geocode the address
          const coords = await geocodeAddress(property.address, property.city, property.postal_code);
          
          // Update the database with the geocoded coordinates only if we got valid coordinates
          if (coords && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
            try {
              await supabase
                .from('properties')
                .update({ coordinates: coords })
                .eq('id', property.id);
              
              console.log(`Updated coordinates for ${property.address}:`, coords);
              return { ...property, coordinates: coords };
            } catch (updateError) {
              console.error('Error updating property coordinates:', updateError);
            }
          }
          
          return { ...property, coordinates: coords };
        })
      );

      setProperties(propertiesWithCoordinates);
      console.log('Properties with coordinates set:', propertiesWithCoordinates.length);
      
      // Store successful fetch timestamp
      localStorage.setItem('propertyData_lastFetch', now.toString());
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke hente eiendommer for kart",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast, lastFetchTime]);

  const fetchCalculationProperties = useCallback(async (forceRefresh = false) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('calculation_history')
        .select('*')
        .eq('user_id', user.id)
        .not('property_address', 'is', null)
        .limit(50); // Limit to prevent too many geocoding requests

      if (error) throw error;

      // Geocode calculation addresses with batching
      console.log('🔍 Processing calculations for map display...');
      const calculationsWithCoordinates = await Promise.all(
        (data || []).slice(0, 20).map(async (calc: any) => { // Further limit to 20 for performance
          console.log(`Processing calculation: ${calc.property_address || 'Unnamed'}`);
          
          // Use existing coordinates from database if available
          if (calc.coordinates && Array.isArray(calc.coordinates) && calc.coordinates.length === 2) {
            console.log(`✅ Using existing coordinates for ${calc.property_address}:`, calc.coordinates);
            return { ...calc, coordinates: calc.coordinates as [number, number] };
          }
          
          // Otherwise geocode the address if it exists
          if (calc.property_address) {
            console.log(`🌐 Geocoding calculation address: ${calc.property_address}`);
            const coords = await geocodeAddress(calc.property_address);
            
            if (coords) {
              console.log(`✅ Got coordinates for ${calc.property_address}:`, coords);
              // Update the database with the geocoded coordinates
              try {
                await supabase
                  .from('calculation_history')
                  .update({ coordinates: coords })
                  .eq('id', calc.id);
                console.log(`💾 Saved coordinates to database for ${calc.property_address}`);
              } catch (updateError) {
                console.error('❌ Error updating calculation coordinates:', updateError);
              }
            } else {
              console.warn(`❌ Failed to geocode: ${calc.property_address}`);
            }
            
            return { ...calc, coordinates: coords };
          }
          return calc;
        })
      );

      setCalculationProperties(calculationsWithCoordinates);
    } catch (error) {
      console.error('Error fetching calculation properties:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Check if data should be refreshed based on last fetch time
  const shouldRefreshData = useCallback(() => {
    const lastFetch = localStorage.getItem('propertyData_lastFetch');
    if (!lastFetch) return true;
    
    const now = Date.now();
    const timeSinceLastFetch = now - parseInt(lastFetch);
    
    // Refresh if more than 1 hour has passed
    return timeSinceLastFetch > 60 * 60 * 1000;
  }, []);

  // Memoize the fetch function to prevent unnecessary re-renders
  const memoizedFetch = useMemo(() => ({
    fetchUserProperties,
    fetchCalculationProperties
  }), [fetchUserProperties, fetchCalculationProperties]);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const shouldRefresh = shouldRefreshData();
        await memoizedFetch.fetchUserProperties(shouldRefresh);
        await memoizedFetch.fetchCalculationProperties(shouldRefresh);
      };
      fetchData();
    } else {
      setProperties([]);
      setCalculationProperties([]);
      setLoading(false);
    }
  }, [user, memoizedFetch, shouldRefreshData]);

  const refetch = useCallback(() => {
    if (user) {
      fetchUserProperties(true); // Force refresh
      fetchCalculationProperties(true); // Force refresh
    }
  }, [user, fetchUserProperties, fetchCalculationProperties]);

  return {
    properties,
    calculationProperties,
    loading,
    refetch
  };
};