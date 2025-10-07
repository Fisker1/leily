import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LoanSettings {
  propertyPrice: number;
  interestRate: number;
  loanPeriod: number;
  desiredLoanAmount: number;
  equityAmount: number;
}

export const useLoanCalculatorSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<LoanSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSettings();
    } else {
      setSettings(null);
      setLoading(false);
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('loan_calculator_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          propertyPrice: Number(data.property_price) || 0,
          interestRate: Number(data.interest_rate) || 0,
          loanPeriod: Number(data.loan_period) || 0,
          desiredLoanAmount: Number(data.desired_loan_amount) || 0,
          equityAmount: Number(data.equity_amount) || 0
        });
      }
    } catch (error) {
      console.error('Error loading loan settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: LoanSettings) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('loan_calculator_settings')
        .upsert({
          user_id: user.id,
          property_price: newSettings.propertyPrice,
          interest_rate: newSettings.interestRate,
          loan_period: newSettings.loanPeriod,
          desired_loan_amount: newSettings.desiredLoanAmount,
          equity_amount: newSettings.equityAmount
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setSettings(newSettings);
      return true;
    } catch (error) {
      console.error('Error saving loan settings:', error);
      return false;
    }
  };

  return {
    settings,
    loading,
    saveSettings,
    refreshSettings: loadSettings
  };
};
