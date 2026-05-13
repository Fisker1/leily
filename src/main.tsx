import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'

// Check cookie consent for analytics
const getCookieConsent = () => {
  try {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) return { analytics: false };
    return JSON.parse(consent);
  } catch {
    return { analytics: false };
  }
};

const consent = getCookieConsent();

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    {consent.analytics && <SpeedInsights />}
    {consent.analytics && <Analytics />}
  </>
);
