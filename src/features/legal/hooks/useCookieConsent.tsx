import { useState, useEffect } from 'react';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export const useCookieConsent = () => {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('cookie-consent');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CookiePreferences;
        setPreferences(parsed);
        setHasConsent(true);
      } catch (error) {
        console.error('Failed to parse cookie preferences:', error);
      }
    }
  }, []);

  const updatePreferences = (newPreferences: CookiePreferences) => {
    localStorage.setItem('cookie-consent', JSON.stringify(newPreferences));
    setPreferences(newPreferences);
    setHasConsent(true);
  };

  const resetConsent = () => {
    localStorage.removeItem('cookie-consent');
    setPreferences(null);
    setHasConsent(false);
  };

  return {
    preferences,
    hasConsent,
    updatePreferences,
    resetConsent,
    // Helper functions for specific checks
    canUseAnalytics: preferences?.analytics ?? false,
    canUseMarketing: preferences?.marketing ?? false,
  };
};
