import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/shared/hooks/use-toast';

interface EquityManagement {
  id: string;
  total_equity: number;
  notes?: string;
  default_interest_rate?: number;
  default_loan_period_years?: number;
  default_equity_percentage?: number;
  created_at: string;
  updated_at: string;
}

interface LoanScenario {
  id: string;
  scenario_name: string;
  property_id?: string;
  calculation_id?: string;
  property_address?: string;
  property_value: number;
  equity_allocated: number;
  loan_amount: number;
  interest_rate: number;
  loan_period_years: number;
  additional_funding_source?: string;
  additional_funding_amount?: number;
  monthly_payment?: number;
  total_interest?: number;
  loan_to_value?: number;
  created_at: string;
  updated_at: string;
}

interface PropertyEquityGain {
  property_id: string;
  address: string;
  initial_value: number;
  current_value: number;
  equity_gain: number;
  initial_loan: number;
  current_loan: number;
}

export const useLoanCalculator = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [equityData, setEquityData] = useState<EquityManagement | null>(null);
  const [scenarios, setScenarios] = useState<LoanScenario[]>([]);
  const [availableEquity, setAvailableEquity] = useState(0);
  const [equityFromPropertyGains, setEquityFromPropertyGains] = useState(0);
  const [propertyEquityDetails, setPropertyEquityDetails] = useState<PropertyEquityGain[]>([]);

  // Fetch user's equity data
  const fetchEquityData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('equity_management')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setEquityData(data);
    } catch (error) {
      console.error('Error fetching equity data:', error);
      toast({
        title: 'Feil',
        description: 'Kunne ikke hente egenkapitaldata',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Fetch loan scenarios
  const fetchScenarios = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('loan_scenarios')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScenarios(data || []);
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      toast({
        title: 'Feil',
        description: 'Kunne ikke hente lånescenarier',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  // Calculate equity from property value gains
  const calculatePropertyEquityGains = useCallback(async () => {
    if (!user) return;

    try {
      // Get all user properties with their initial and current values
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id, address, purchase_price, purchase_date, loan_amount, current_value, last_valuation_date')
        .eq('owner_id', user.id);

      if (propError) throw propError;

      if (!properties || properties.length === 0) {
        setEquityFromPropertyGains(0);
        setPropertyEquityDetails([]);
        return;
      }

      const equityDetails: PropertyEquityGain[] = [];
      let totalEquityGain = 0;

      for (const property of properties) {
        // Get the earliest valuation (when they added the property)
        const { data: initialValuation } = await supabase
          .from('property_valuations')
          .select('valuation_amount, valuation_date')
          .eq('property_id', property.id)
          .order('valuation_date', { ascending: true })
          .limit(1)
          .maybeSingle();

        // Get the latest valuation
        const { data: latestValuation } = await supabase
          .from('property_valuations')
          .select('valuation_amount, valuation_date')
          .eq('property_id', property.id)
          .order('valuation_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        const initialValue = initialValuation?.valuation_amount || property.purchase_price || 0;
        const currentValue = latestValuation?.valuation_amount || property.current_value || initialValue;
        
        // Calculate equity gain from property appreciation
        const valueIncrease = Number(currentValue) - Number(initialValue);
        
        // Estimate current loan amount (simplified - could be more sophisticated)
        const initialLoan = Number(property.loan_amount) || 0;
        const assumedPaydown = 0; // For simplicity, not calculating paydown
        const currentLoan = Math.max(0, initialLoan - assumedPaydown);
        
        const equityGain = valueIncrease; // The increase in value is additional equity
        
        if (equityGain > 0) {
          totalEquityGain += equityGain;
          equityDetails.push({
            property_id: property.id,
            address: property.address,
            initial_value: Number(initialValue),
            current_value: Number(currentValue),
            equity_gain: equityGain,
            initial_loan: initialLoan,
            current_loan: currentLoan,
          });
        }
      }

      setEquityFromPropertyGains(totalEquityGain);
      setPropertyEquityDetails(equityDetails);
    } catch (error) {
      console.error('Error calculating property equity gains:', error);
      setEquityFromPropertyGains(0);
      setPropertyEquityDetails([]);
    }
  }, [user]);

  // Calculate available equity
  const calculateAvailableEquity = useCallback(() => {
    const manualEquity = equityData ? Number(equityData.total_equity) : 0;
    const propertyGainEquity = equityFromPropertyGains;
    const totalEquityAvailable = manualEquity + propertyGainEquity;
    
    const totalAllocated = scenarios.reduce(
      (sum, scenario) => sum + Number(scenario.equity_allocated),
      0
    );
    
    setAvailableEquity(totalEquityAvailable - totalAllocated);
  }, [equityData, equityFromPropertyGains, scenarios]);

  // Save or update equity data
  const saveEquityData = useCallback(async (
    totalEquity: number, 
    notes?: string,
    defaultInterestRate?: number,
    defaultLoanPeriod?: number,
    defaultEquityPercentage?: number
  ) => {
    if (!user) return false;

    setLoading(true);
    try {
      if (equityData) {
        // Update existing
        const { error } = await supabase
          .from('equity_management')
          .update({
            total_equity: totalEquity,
            notes,
            default_interest_rate: defaultInterestRate,
            default_loan_period_years: defaultLoanPeriod,
            default_equity_percentage: defaultEquityPercentage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', equityData.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('equity_management')
          .insert({
            user_id: user.id,
            total_equity: totalEquity,
            notes,
            default_interest_rate: defaultInterestRate,
            default_loan_period_years: defaultLoanPeriod,
            default_equity_percentage: defaultEquityPercentage,
          });

        if (error) throw error;
      }

      await fetchEquityData();
      toast({
        title: 'Lagret',
        description: 'Egenkapitaldata og standardverdier er oppdatert',
      });
      return true;
    } catch (error) {
      console.error('Error saving equity data:', error);
      toast({
        title: 'Feil',
        description: 'Kunne ikke lagre egenkapitaldata',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, equityData, fetchEquityData, toast]);

  // Calculate loan payment
  const calculateLoanPayment = useCallback((
    loanAmount: number,
    interestRate: number,
    loanPeriodYears: number
  ) => {
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanPeriodYears * 12;
    
    if (monthlyRate === 0) {
      return loanAmount / numPayments;
    }
    
    const monthlyPayment =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    return monthlyPayment;
  }, []);

  // Save loan scenario
  const saveScenario = useCallback(async (
    scenarioData: Omit<LoanScenario, 'id' | 'created_at' | 'updated_at'>
  ) => {
    if (!user) return false;

    // Calculate derived values
    const monthlyPayment = calculateLoanPayment(
      scenarioData.loan_amount,
      scenarioData.interest_rate,
      scenarioData.loan_period_years
    );
    
    const totalInterest = monthlyPayment * scenarioData.loan_period_years * 12 - scenarioData.loan_amount;
    const loanToValue = (scenarioData.loan_amount / scenarioData.property_value) * 100;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('loan_scenarios')
        .insert({
          user_id: user.id,
          ...scenarioData,
          monthly_payment: monthlyPayment,
          total_interest: totalInterest,
          loan_to_value: loanToValue,
        });

      if (error) throw error;

      await fetchScenarios();
      toast({
        title: 'Lagret',
        description: 'Lånescenario er lagret',
      });
      return true;
    } catch (error) {
      console.error('Error saving scenario:', error);
      toast({
        title: 'Feil',
        description: 'Kunne ikke lagre lånescenario',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, calculateLoanPayment, fetchScenarios, toast]);

  // Delete scenario
  const deleteScenario = useCallback(async (scenarioId: string) => {
    if (!user) return false;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('loan_scenarios')
        .delete()
        .eq('id', scenarioId);

      if (error) throw error;

      await fetchScenarios();
      toast({
        title: 'Slettet',
        description: 'Lånescenario er slettet',
      });
      return true;
    } catch (error) {
      console.error('Error deleting scenario:', error);
      toast({
        title: 'Feil',
        description: 'Kunne ikke slette lånescenario',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchScenarios, toast]);

  // Validate if equity allocation is available
  const validateEquityAllocation = useCallback((requestedEquity: number, excludeScenarioId?: string) => {
    if (!equityData) return { valid: false, message: 'Ingen egenkapitaldata funnet' };

    const allocatedExcludingCurrent = scenarios
      .filter(s => s.id !== excludeScenarioId)
      .reduce((sum, scenario) => sum + Number(scenario.equity_allocated), 0);

    const available = Number(equityData.total_equity) - allocatedExcludingCurrent;
    
    if (requestedEquity > available) {
      return {
        valid: false,
        message: `Utilgjengelig egenkapital. Tilgjengelig: ${available.toLocaleString('nb-NO')} kr`,
        available,
      };
    }

    return { valid: true, available };
  }, [equityData, scenarios]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchEquityData();
      fetchScenarios();
      calculatePropertyEquityGains();
    }
  }, [user, fetchEquityData, fetchScenarios, calculatePropertyEquityGains]);

  // Recalculate available equity when data changes
  useEffect(() => {
    calculateAvailableEquity();
  }, [calculateAvailableEquity]);

  return {
    loading,
    equityData,
    scenarios,
    availableEquity,
    equityFromPropertyGains,
    propertyEquityDetails,
    fetchEquityData,
    fetchScenarios,
    saveEquityData,
    saveScenario,
    deleteScenario,
    validateEquityAllocation,
    calculateLoanPayment,
    calculatePropertyEquityGains,
  };
};
