import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ExternalLenderSettings {
  hasExternalLender: boolean;
  externalLenderName: string;
}

export const useExternalLenderSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ExternalLenderSettings | null>(null);
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
        .from('external_lender_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          hasExternalLender: data.has_external_lender || false,
          externalLenderName: data.external_lender_name || ''
        });
      }
    } catch (error) {
      console.error('Error loading external lender settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: ExternalLenderSettings) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('external_lender_settings')
        .upsert({
          user_id: user.id,
          has_external_lender: newSettings.hasExternalLender,
          external_lender_name: newSettings.externalLenderName
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setSettings(newSettings);
      return true;
    } catch (error) {
      console.error('Error saving external lender settings:', error);
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
