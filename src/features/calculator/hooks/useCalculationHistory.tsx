import { useState, useEffect } from 'react';
import { supabase } from '@/shared/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/shared/hooks/use-toast';

export interface CalculationHistoryItem {
  id: string;
  calculation_name: string | null;
  finn_code: string | null;
  property_address: string | null;
  coordinates: number[] | null;
  calculation_data: any;
  results_data: any;
  created_at: string;
  updated_at: string;
}

export const useCalculationHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [calculations, setCalculations] = useState<CalculationHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCalculations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('calculation_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCalculations(data || []);
    } catch (error) {
      console.error('Error fetching calculations:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke hente kalkulasjonshistorikk",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveCalculation = async (
    calculationName: string,
    finnCode: string | null,
    propertyAddress: string | null,
    calculationData: any,
    resultsData: any
  ) => {
    if (!user) {
      toast({
        title: "Logg inn påkrevd",
        description: "Du må logge inn for å lagre kalkulasjoner",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Geocode the address to get coordinates if address is provided
      let coordinates: number[] | null = null;
      if (propertyAddress) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(propertyAddress)}&countrycodes=no&limit=1`,
            {
              headers: {
                'User-Agent': 'Leily Property App'
              }
            }
          );
          const data = await response.json();
          if (data && data.length > 0) {
            coordinates = [parseFloat(data[0].lon), parseFloat(data[0].lat)];
          }
        } catch (geoError) {
          console.error('Geocoding error:', geoError);
          // Continue without coordinates if geocoding fails
        }
      }

      const { data, error } = await supabase
        .from('calculation_history')
        .insert({
          user_id: user.id,
          calculation_name: calculationName,
          finn_code: finnCode,
          property_address: propertyAddress,
          coordinates: coordinates,
          calculation_data: calculationData,
          results_data: resultsData,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Lagret",
        description: "Kalkulasjonen er lagret i biblioteket",
      });

      // Refresh the calculations list
      fetchCalculations();
      return data;
    } catch (error) {
      console.error('Error saving calculation:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke lagre kalkulasjonen",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateCalculation = async (
    id: string,
    updates: Partial<Omit<CalculationHistoryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('calculation_history')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Oppdatert",
        description: "Kalkulasjonen er oppdatert",
      });

      // Refresh the calculations list
      fetchCalculations();
      return data;
    } catch (error) {
      console.error('Error updating calculation:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke oppdatere kalkulasjonen",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteCalculation = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('calculation_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Slettet",
        description: "Kalkulasjonen er fjernet fra biblioteket",
      });

      // Refresh the calculations list
      fetchCalculations();
      return true;
    } catch (error) {
      console.error('Error deleting calculation:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke slette kalkulasjonen",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchCalculations();
    }
  }, [user]);

  return {
    calculations,
    loading,
    fetchCalculations,
    saveCalculation,
    updateCalculation,
    deleteCalculation,
  };
};