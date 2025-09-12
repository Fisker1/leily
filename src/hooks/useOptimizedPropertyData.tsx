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
  
  while (geocodingQueue.length > 0) {
    const { resolve, address } = geocodingQueue.shift()!;
    
    if (geocodeCache.has(address)) {
      resolve(geocodeCache.get(address) || null);
      continue;
    }
    
    try {
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
        const coords = data && data.length > 0 
          ? [parseFloat(data[0].lon), parseFloat(data[0].lat)] as [number, number]
          : null;
        
        geocodeCache.set(address, coords);
        resolve(coords);
      } else {
        geocodeCache.set(address, null);
        resolve(null);
      }
      
      // Rate limiting - wait 300ms between requests
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('Geocoding error:', error);
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

  const fetchUserProperties = useCallback(async () => {
    if (!user) return;

    // Prevent excessive API calls - minimum 5 seconds between fetches
    const now = Date.now();
    if (now - lastFetchTime < 5000) {
      return;
    }
    setLastFetchTime(now);

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id);

      if (error) throw error;

      // Only geocode properties that don't have coordinates yet
      const propertiesWithCoordinates = await Promise.all(
        (data || []).map(async (property: any) => {
          const coords = await geocodeAddress(property.address, property.city, property.postal_code);
          return { ...property, coordinates: coords };
        })
      );

      setProperties(propertiesWithCoordinates);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke hente eiendommer for kart",
        variant: "destructive",
      });
    }
  }, [user, toast, lastFetchTime]);

  const fetchCalculationProperties = useCallback(async () => {
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
      const calculationsWithCoordinates = await Promise.all(
        (data || []).slice(0, 20).map(async (calc: any) => { // Further limit to 20 for performance
          if (calc.property_address) {
            const coords = await geocodeAddress(calc.property_address);
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

  // Memoize the fetch function to prevent unnecessary re-renders
  const memoizedFetch = useMemo(() => ({
    fetchUserProperties,
    fetchCalculationProperties
  }), [fetchUserProperties, fetchCalculationProperties]);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        await memoizedFetch.fetchUserProperties();
        await memoizedFetch.fetchCalculationProperties();
      };
      fetchData();
    } else {
      setProperties([]);
      setCalculationProperties([]);
      setLoading(false);
    }
  }, [user, memoizedFetch]);

  const refetch = useCallback(() => {
    if (user) {
      fetchUserProperties();
      fetchCalculationProperties();
    }
  }, [user, fetchUserProperties, fetchCalculationProperties]);

  return {
    properties,
    calculationProperties,
    loading,
    refetch
  };
};