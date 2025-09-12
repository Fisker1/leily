import { useState, useEffect } from 'react';
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

export const usePropertyData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [calculationProperties, setCalculationProperties] = useState<CalculationProperty[]>([]);
  const [loading, setLoading] = useState(false);

  // Cache for geocoded addresses to prevent duplicate API calls
  const geocodeCache = useState(new Map<string, [number, number] | null>())[0];

  // Simple geocoding function with caching and rate limiting
  const geocodeAddress = async (address: string, city?: string, postalCode?: string): Promise<[number, number] | null> => {
    const fullAddress = `${address}${city ? `, ${city}` : ''}${postalCode ? `, ${postalCode}` : ''}, Norge`;
    
    // Check cache first
    if (geocodeCache.has(fullAddress)) {
      return geocodeCache.get(fullAddress) || null;
    }

    try {
      const encodedAddress = encodeURIComponent(fullAddress);
      
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=no`,
        {
          headers: {
            'User-Agent': 'Leily Property App'
          }
        }
      );
      
      if (!response.ok) {
        geocodeCache.set(fullAddress, null);
        return null;
      }
      
      const data = await response.json();
      const coords = data && data.length > 0 
        ? [parseFloat(data[0].lon), parseFloat(data[0].lat)] as [number, number]
        : null;
      
      // Cache the result
      geocodeCache.set(fullAddress, coords);
      return coords;
    } catch (error) {
      console.error('Geocoding error for address:', address, error);
      geocodeCache.set(fullAddress, null);
      return null;
    }
  };

  const fetchUserProperties = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id);

      if (error) throw error;

      // Geocode addresses for properties that don't have coordinates
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
  };

  const fetchCalculationProperties = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('calculation_history')
        .select('*')
        .eq('user_id', user.id)
        .not('property_address', 'is', null);

      if (error) throw error;

      // Geocode calculation addresses
      const calculationsWithCoordinates = await Promise.all(
        (data || []).map(async (calc: any) => {
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
  };

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        await fetchUserProperties();
        await fetchCalculationProperties();
      };
      fetchData();
    }
  }, [user]);

  return {
    properties,
    calculationProperties,
    loading,
    refetch: () => {
      fetchUserProperties();
      fetchCalculationProperties();
    }
  };
};