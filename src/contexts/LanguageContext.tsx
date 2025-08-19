import React, { createContext, useContext, useState } from 'react';

export type Language = 'no' | 'en';

interface Translations {
  // Navigation
  features: string;
  calculator: string;
  
  // Hero section
  heroTitle: string;
  heroTitleHighlight: string;
  heroDescription: string;
  startAnalysis: string;
  viewDemo: string;
  yieldAnalysis: string;
  cashFlow: string;
  pdfReports: string;
  roiCalculator: string;
  
  // Features section
  featuresTitle: string;
  featuresTitleHighlight: string;
  featuresDescription: string;
  advancedCalculator: string;
  advancedCalculatorDesc: string;
  yieldAnalysisTitle: string;
  yieldAnalysisDesc: string;
  pdfReportsTitle: string;
  pdfReportsDesc: string;
  marketComparison: string;
  marketComparisonDesc: string;
  cashFlowTracking: string;
  cashFlowTrackingDesc: string;
  portfolioManagement: string;
  portfolioManagementDesc: string;
  
  // Calculator section
  calculatorTitle: string;
  calculatorTitleHighlight: string;
  calculatorDescription: string;
  propertyDetails: string;
  propertyDetailsDesc: string;
  propertyValue: string;
  monthlyRent: string;
  monthlyExpenses: string;
  generateFullReport: string;
  grossYield: string;
  grossYieldDesc: string;
  netYield: string;
  netYieldDesc: string;
  monthlyCashFlow: string;
  monthlyCashFlowDesc: string;
  
  // CTA section
  ctaTitle: string;
  ctaTitleHighlight: string;
  ctaDescription: string;
  startFreeAnalysis: string;
  downloadSampleReport: string;
  noCreditCard: string;
  instantCalculations: string;
  professionalReports: string;
  
  // Footer
  companyDescription: string;
  copyright: string;
  product: string;
  calculatorNav: string;
  reports: string;
  portfolio: string;
  api: string;
  support: string;
  helpCenter: string;
  contact: string;
  privacy: string;
  terms: string;
  quickAnalysis: string;
  yield: string;
  currency: string;
}

const translations: Record<Language, Translations> = {
  no: {
    // Navigation
    features: 'Funksjoner',
    calculator: 'Kalkulator',
    
    // Hero section
    heroTitle: 'Smart Eiendoms',
    heroTitleHighlight: 'Investerings Analyse',
    heroDescription: 'Beregn avkastning, analyser kontantstrøm og generer profesjonelle rapporter for dine eiendomsinvesteringer. Ta informerte beslutninger med våre omfattende analyseverktøy.',
    startAnalysis: 'Start Analyse',
    viewDemo: 'Se Demo',
    yieldAnalysis: 'Avkastningsanalyse',
    cashFlow: 'Kontantstrøm',
    pdfReports: 'PDF Rapporter',
    roiCalculator: 'Avkastningskalkulator',
    
    // Features section
    featuresTitle: 'Alt Du Trenger for',
    featuresTitleHighlight: 'Eiendomsanalyse',
    featuresDescription: 'Profesjonelle verktøy for å analysere, evaluere og rapportere på eiendomsinvesteringer med bankklare dokumenter.',
    advancedCalculator: 'Avansert Kalkulator',
    advancedCalculatorDesc: 'Omfattende eiendomsanalyse med leieavkastning, kontantstrøm og avkastningsberegninger.',
    yieldAnalysisTitle: 'Avkastningsanalyse',
    yieldAnalysisDesc: 'Beregn brutto og netto leieavkastning for å evaluere investeringspotensial.',
    pdfReportsTitle: 'PDF Rapporter',
    pdfReportsDesc: 'Generer profesjonelle rapporter for banker, investorer og interessenter.',
    marketComparison: 'Markedssammenligning',
    marketComparisonDesc: 'Sammenlign eiendommer mot markedsgjennomsnitt og lignende investeringer.',
    cashFlowTracking: 'Kontantstrømsporing',
    cashFlowTrackingDesc: 'Overvåk månedlig kontantstrøm, utgifter og lønnsomhet over tid.',
    portfolioManagement: 'Porteføljestyring',
    portfolioManagementDesc: 'Administrer flere eiendommer og spor total porteføljeytelse.',
    
    // Calculator section
    calculatorTitle: 'Prøv Vår',
    calculatorTitleHighlight: 'Investerings Kalkulator',
    calculatorDescription: 'Få øyeblikkelig analyse av ditt eiendomsinvesteringspotensial. Se avkastning, kontantstrøm og returner i sanntid.',
    propertyDetails: 'Eiendomsdetaljer',
    propertyDetailsDesc: 'Skriv inn eiendomsinformasjon for å beregne investeringsmålinger',
    propertyValue: 'Eiendomsverdi (NOK)',
    monthlyRent: 'Månedlig Leie (NOK)',
    monthlyExpenses: 'Månedlige Utgifter (NOK)',
    generateFullReport: 'Generer Full Rapport',
    grossYield: 'Brutto Avkastning',
    grossYieldDesc: 'Årlig avkastning før utgifter',
    netYield: 'Netto Avkastning',
    netYieldDesc: 'Årlig avkastning etter utgifter',
    monthlyCashFlow: 'Månedlig Kontantstrøm',
    monthlyCashFlowDesc: 'Netto månedlig inntekt',
    
    // CTA section
    ctaTitle: 'Klar til å Analysere Din',
    ctaTitleHighlight: 'Neste Investering?',
    ctaDescription: 'Bli med tusenvis av investorer som bruker PropertyCalc for å ta smartere eiendomsinvesteringsbeslutninger med profesjonell analyse og bankklare rapporter.',
    startFreeAnalysis: 'Start Gratis Analyse',
    downloadSampleReport: 'Last Ned Eksempelrapport',
    noCreditCard: 'Ikke behov for kredittkort',
    instantCalculations: 'Øyeblikkelige beregninger',
    professionalReports: 'Profesjonelle PDF rapporter',
    
    // Footer
    companyDescription: 'Profesjonelle eiendomsinvesteringsanalyseverktøy for smartere investeringsbeslutninger.',
    copyright: '© 2024 PropertyCalc. Alle rettigheter reservert.',
    product: 'Produkt',
    calculatorNav: 'Kalkulator',
    reports: 'Rapporter',
    portfolio: 'Portefølje',
    api: 'API',
    support: 'Support',
    helpCenter: 'Hjelpesenter',
    contact: 'Kontakt',
    privacy: 'Personvern',
    terms: 'Vilkår',
    quickAnalysis: 'Rask Analyse',
    yield: 'Avkastning',
    currency: 'NOK'
  },
  en: {
    // Navigation
    features: 'Features',
    calculator: 'Calculator',
    
    // Hero section
    heroTitle: 'Smart Property',
    heroTitleHighlight: 'Investment Analysis',
    heroDescription: 'Calculate yields, analyze cash flow, and generate professional reports for your property investments. Make informed decisions with our comprehensive analysis tools.',
    startAnalysis: 'Start Analysis',
    viewDemo: 'View Demo',
    yieldAnalysis: 'Yield Analysis',
    cashFlow: 'Cash Flow',
    pdfReports: 'PDF Reports',
    roiCalculator: 'ROI Calculator',
    
    // Features section
    featuresTitle: 'Everything You Need for',
    featuresTitleHighlight: 'Property Analysis',
    featuresDescription: 'Professional-grade tools to analyze, evaluate, and report on property investments with bank-ready documentation.',
    advancedCalculator: 'Advanced Calculator',
    advancedCalculatorDesc: 'Comprehensive property analysis with rental yield, cash flow, and ROI calculations.',
    yieldAnalysisTitle: 'Yield Analysis',
    yieldAnalysisDesc: 'Calculate gross and net rental yields to evaluate investment potential.',
    pdfReportsTitle: 'PDF Reports',
    pdfReportsDesc: 'Generate professional reports for banks, investors, and stakeholders.',
    marketComparison: 'Market Comparison',
    marketComparisonDesc: 'Compare properties against market averages and similar investments.',
    cashFlowTracking: 'Cash Flow Tracking',
    cashFlowTrackingDesc: 'Monitor monthly cash flow, expenses, and profitability over time.',
    portfolioManagement: 'Portfolio Management',
    portfolioManagementDesc: 'Manage multiple properties and track overall portfolio performance.',
    
    // Calculator section
    calculatorTitle: 'Try Our',
    calculatorTitleHighlight: 'Investment Calculator',
    calculatorDescription: 'Get instant analysis of your property investment potential. See yields, cash flow, and returns in real-time.',
    propertyDetails: 'Property Details',
    propertyDetailsDesc: 'Enter your property information to calculate investment metrics',
    propertyValue: 'Property Value (USD)',
    monthlyRent: 'Monthly Rent (USD)',
    monthlyExpenses: 'Monthly Expenses (USD)',
    generateFullReport: 'Generate Full Report',
    grossYield: 'Gross Yield',
    grossYieldDesc: 'Annual return before expenses',
    netYield: 'Net Yield',
    netYieldDesc: 'Annual return after expenses',
    monthlyCashFlow: 'Monthly Cash Flow',
    monthlyCashFlowDesc: 'Net monthly income',
    
    // CTA section
    ctaTitle: 'Ready to Analyze Your',
    ctaTitleHighlight: 'Next Investment?',
    ctaDescription: 'Join thousands of investors using PropertyCalc to make smarter property investment decisions with professional analysis and bank-ready reports.',
    startFreeAnalysis: 'Start Free Analysis',
    downloadSampleReport: 'Download Sample Report',
    noCreditCard: 'No credit card required',
    instantCalculations: 'Instant calculations',
    professionalReports: 'Professional PDF reports',
    
    // Footer
    companyDescription: 'Professional property investment analysis tools for smarter investment decisions.',
    copyright: '© 2024 PropertyCalc. All rights reserved.',
    product: 'Product',
    calculatorNav: 'Calculator',
    reports: 'Reports',
    portfolio: 'Portfolio',
    api: 'API',
    support: 'Support',
    helpCenter: 'Help Center',
    contact: 'Contact',
    privacy: 'Privacy',
    terms: 'Terms',
    quickAnalysis: 'Quick Analysis',
    yield: 'Yield',
    currency: 'USD'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('no');

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};