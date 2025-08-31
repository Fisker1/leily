import React, { createContext, useContext, useState } from 'react';

export type Language = 'no' | 'en';

interface Translations {
  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    back: string;
    next: string;
    previous: string;
    close: string;
    submit: string;
    confirm: string;
    backToHome: string;
  };

  // Navigation
  nav: {
    company: string;
    features: string;
    calculator: string;
    signIn: string;
    startAnalysis: string;
    dashboard: string;
    properties: string;
    tenants: string;
    leases: string;
    profile: string;
    signOut: string;
  };

  // Hero section
  hero: {
    title: string;
    subtitle: string;
    cta: string;
    secondaryCta: string;
  };

  // Features
  features: {
    title: string;
    subtitle: string;
    feature1: {
      title: string;
      description: string;
    };
    feature2: {
      title: string;
      description: string;
    };
    feature3: {
      title: string;
      description: string;
    };
  };

  // Calculator
  calculator: {
    title: string;
    subtitle: string;
    propertyValue: string;
    downPayment: string;
    interestRate: string;
    loanTerm: string;
    monthlyRent: string;
    calculate: string;
    results: {
      monthlyPayment: string;
      totalCost: string;
      monthlyReturn: string;
      annualReturn: string;
    };
  };

  // Call to Action
  cta: {
    title: string;
    subtitle: string;
    button: string;
  };

  // Footer
  footer: {
    company: string;
    description: string;
    links: {
      about: string;
      contact: string;
      privacy: string;
      terms: string;
    };
    contact: {
      title: string;
      email: string;
      phone: string;
    };
    social: {
      title: string;
    };
    copyright: string;
  };

  // Authentication
  auth: {
    signIn: string;
    signUp: string;
    signOut: string;
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
    welcome: string;
    welcomeBack: string;
    signInToAccount: string;
    getStarted: string;
    chooseSignInMethod: string;
    continueWithGoogle: string;
    continueWithFacebook: string;
    orContinueWith: string;
    passwordMismatch: string;
    signInSuccess: string;
    signUpSuccess: string;
    success: string;
    learnAboutPlans: string;
  };

  // Dashboard
  dashboard: {
    welcome: string;
    user: string;
    welcomeMessage: string;
    proPlan: string;
    freePlan: string;
    upgrade: string;
    properties: string;
    totalProperties: string;
    tenants: string;
    totalTenants: string;
    activeLeases: string;
    currentlyActive: string;
    monthlyIncome: string;
    totalMonthlyRent: string;
    upcomingExpirations: string;
    leasesExpiringSoon: string;
    viewLeases: string;
    quickActions: string;
    addProperty: string;
    addPropertyDesc: string;
    addTenant: string;
    addTenantDesc: string;
    createLease: string;
    createLeaseDesc: string;
    recentActivity: string;
    recentActivityDesc: string;
    noRecentActivity: string;
  };

  // Pricing
  pricing: {
    choosePlan: string;
    planDescription: string;
    freePlan: string;
    freeDescription: string;
    proPlan: string;
    proDescription: string;
    month: string;
    mostPopular: string;
    getStarted: string;
    upgradeToPro: string;
    currentPlan: string;
    unlimitedAnalysis: string;
    basicReports: string;
    communitySupport: string;
    pdfExports: string;
    rentalManagement: string;
    tenantTracking: string;
    leaseDocuments: string;
    depositTracking: string;
    prioritySupport: string;
    advancedReports: string;
    pdfExportNote: string;
    pdfExportPrice: string;
    faq: string;
    faqQ1: string;
    faqA1: string;
    faqQ2: string;
    faqA2: string;
    faqQ3: string;
    faqA3: string;
  };
}

const translations: Record<Language, Translations> = {
  no: {
    common: {
      loading: 'Laster...',
      error: 'Feil',
      success: 'Suksess',
      cancel: 'Avbryt',
      save: 'Lagre',
      delete: 'Slett',
      edit: 'Rediger',
      back: 'Tilbake',
      next: 'Neste',
      previous: 'Forrige',
      close: 'Lukk',
      submit: 'Send inn',
      confirm: 'Bekreft',
      backToHome: 'Tilbake til forsiden',
    },
    nav: {
      company: 'Leily',
      features: 'Funksjoner',
      calculator: 'Kalkulator',
      signIn: 'Logg inn',
      startAnalysis: 'Start analyse',
      dashboard: 'Dashbord',
      properties: 'Eiendommer',
      tenants: 'Leietakere',
      leases: 'Leiekontrakter',
      profile: 'Profil',
      signOut: 'Logg ut',
    },
    hero: {
      title: 'Smart investeringsanalyse for eiendom',
      subtitle: 'Få profesjonelle analyser av eiendomsinvesteringer på få minutter. Vårt verktøy hjelper deg å ta informerte beslutninger med detaljerte beregninger av lønnsomhet og risiko.',
      cta: 'Start gratis analyse',
      secondaryCta: 'Se hvordan det virker',
    },
    features: {
      title: 'Alt du trenger for eiendomsanalyse',
      subtitle: 'Våre verktøy gir deg innsikt i lønnsomhet, finansiering og risiko',
      feature1: {
        title: 'Avanserte beregninger',
        description: 'Få detaljerte analyser av cash flow, avkastning og finansieringskostnader med våre profesjonelle kalkulatorer.',
      },
      feature2: {
        title: 'Markedsanalyse',
        description: 'Sammenlign priser og leieinntekter i området for å forstå markedspotensialet til din investering.',
      },
      feature3: {
        title: 'Risikoevaluering',
        description: 'Identifiser potensielle risikoer og få anbefalinger for å optimalisere investeringsstrategien din.',
      },
    },
    calculator: {
      title: 'Beregn lønnsomhet',
      subtitle: 'Få en rask oversikt over investeringens potensial',
      propertyValue: 'Eiendomsverdi (kr)',
      downPayment: 'Egenkapital (%)',
      interestRate: 'Rente (%)',
      loanTerm: 'Nedbetalingstid (år)',
      monthlyRent: 'Månedlig leieinntekt (kr)',
      calculate: 'Beregn',
      results: {
        monthlyPayment: 'Månedlig betaling',
        totalCost: 'Total kostnad',
        monthlyReturn: 'Månedlig avkastning',
        annualReturn: 'Årlig avkastning',
      },
    },
    cta: {
      title: 'Klar til å starte din eiendomsanalyse?',
      subtitle: 'Bli med tusenvis av investorer som bruker våre verktøy for å ta smarte beslutninger.',
      button: 'Kom i gang gratis',
    },
    footer: {
      company: 'Leily',
      description: 'Din partner for smarte eiendomsinvesteringer',
      links: {
        about: 'Om oss',
        contact: 'Kontakt',
        privacy: 'Personvern',
        terms: 'Vilkår',
      },
      contact: {
        title: 'Kontakt oss',
        email: 'kontakt@aproposbolig.no',
        phone: '+47 123 45 678',
      },
      social: {
        title: 'Følg oss',
      },
      copyright: '© 2025 Leily. Alle rettigheter forbeholdt.',
    },
    auth: {
      signIn: 'Logg inn',
      signUp: 'Registrer deg',
      signOut: 'Logg ut',
      email: 'E-post',
      password: 'Passord',
      confirmPassword: 'Bekreft passord',
      fullName: 'Fullt navn',
      welcome: 'Velkommen!',
      welcomeBack: 'Velkommen tilbake!',
      signInToAccount: 'Logg inn på din konto',
      getStarted: 'Kom i gang',
      chooseSignInMethod: 'Velg innloggingsmetode',
      continueWithGoogle: 'Fortsett med Google',
      continueWithFacebook: 'Fortsett med Facebook',
      orContinueWith: 'Eller fortsett med',
      passwordMismatch: 'Passordene stemmer ikke overens',
      signInSuccess: 'Innlogging vellykket',
      signUpSuccess: 'Registrering vellykket! Sjekk e-posten din for bekreftelse.',
      success: 'Suksess',
      learnAboutPlans: 'Lær om våre abonnementsplaner',
    },
    dashboard: {
      welcome: 'Velkommen',
      user: 'Bruker',
      welcomeMessage: 'Her er en oversikt over dine eiendommer og leieforhold.',
      proPlan: 'Pro-plan',
      freePlan: 'Gratis plan',
      upgrade: 'Oppgrader',
      properties: 'Eiendommer',
      totalProperties: 'Totalt antall eiendommer',
      tenants: 'Leietakere',
      totalTenants: 'Totalt antall leietakere',
      activeLeases: 'Aktive leiekontrakter',
      currentlyActive: 'For øyeblikket aktive',
      monthlyIncome: 'Månedlig inntekt',
      totalMonthlyRent: 'Total månedlig leie',
      upcomingExpirations: 'Utgående kontrakter',
      leasesExpiringSoon: 'leiekontrakter utløper snart',
      viewLeases: 'Se leiekontrakter',
      quickActions: 'Hurtighandlinger',
      addProperty: 'Legg til eiendom',
      addPropertyDesc: 'Registrer en ny eiendom i systemet',
      addTenant: 'Legg til leietaker',
      addTenantDesc: 'Registrer en ny leietaker',
      createLease: 'Opprett leiekontrakt',
      createLeaseDesc: 'Opprett ny leiekontrakt',
      recentActivity: 'Nylig aktivitet',
      recentActivityDesc: 'Se de siste endringene i systemet',
      noRecentActivity: 'Ingen nylig aktivitet å vise',
    },
    pricing: {
      choosePlan: 'Velg din plan',
      planDescription: 'Få tilgang til profesjonell eiendomsanalyse og utleieadministrasjon.',
      freePlan: 'Gratis',
      freeDescription: 'Perfekt for å komme i gang med eiendomsanalyse',
      proPlan: 'Pro',
      proDescription: 'Alt du trenger for profesjonell utleievirksomhet',
      month: 'måned',
      mostPopular: 'Mest populær',
      getStarted: 'Kom i gang',
      upgradeToPro: 'Oppgrader til Pro',
      currentPlan: 'Nåværende plan',
      unlimitedAnalysis: 'Ubegrensede analyser',
      basicReports: 'Grunnleggende rapporter',
      communitySupport: 'Community-støtte',
      pdfExports: 'PDF-eksport av analyser',
      rentalManagement: 'Utleieadministrasjon',
      tenantTracking: 'Leietakersporing',
      leaseDocuments: 'Leieavtaler og dokumenter',
      depositTracking: 'Depositumsporing',
      prioritySupport: 'Prioritert kundestøtte',
      advancedReports: 'Avanserte rapporter',
      pdfExportNote: 'PDF-eksport for gratis brukere:',
      pdfExportPrice: '20 kr per analyse via Vipps',
      faq: 'Ofte stilte spørsmål',
      faqQ1: 'Kan jeg endre plan senere?',
      faqA1: 'Ja, du kan oppgradere eller nedgradere planen din når som helst fra din profil.',
      faqQ2: 'Hva inkluderer utleieadministrasjon?',
      faqA2: 'Fullstendig system for å administrere eiendommer, leietakere, leieavtaler og depositumer.',
      faqQ3: 'Er det binding på Pro-planen?',
      faqA3: 'Nei, du kan si opp abonnementet når som helst uten bindingstid.',
    },
  },
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      close: 'Close',
      submit: 'Submit',
      confirm: 'Confirm',
      backToHome: 'Back to home',
    },
    nav: {
      company: 'Leily',
      features: 'Features',
      calculator: 'Calculator',
      signIn: 'Sign in',
      startAnalysis: 'Start analysis',
      dashboard: 'Dashboard',
      properties: 'Properties',
      tenants: 'Tenants',
      leases: 'Leases',
      profile: 'Profile',
      signOut: 'Sign out',
    },
    hero: {
      title: 'Smart investment analysis for real estate',
      subtitle: 'Get professional real estate investment analyses in minutes. Our tool helps you make informed decisions with detailed profitability and risk calculations.',
      cta: 'Start free analysis',
      secondaryCta: 'See how it works',
    },
    features: {
      title: 'Everything you need for property analysis',
      subtitle: 'Our tools give you insights into profitability, financing, and risk',
      feature1: {
        title: 'Advanced calculations',
        description: 'Get detailed analyses of cash flow, returns, and financing costs with our professional calculators.',
      },
      feature2: {
        title: 'Market analysis',
        description: 'Compare prices and rental income in the area to understand the market potential of your investment.',
      },
      feature3: {
        title: 'Risk evaluation',
        description: 'Identify potential risks and get recommendations to optimize your investment strategy.',
      },
    },
    calculator: {
      title: 'Calculate profitability',
      subtitle: 'Get a quick overview of the investment potential',
      propertyValue: 'Property value (kr)',
      downPayment: 'Down payment (%)',
      interestRate: 'Interest rate (%)',
      loanTerm: 'Loan term (years)',
      monthlyRent: 'Monthly rental income (kr)',
      calculate: 'Calculate',
      results: {
        monthlyPayment: 'Monthly payment',
        totalCost: 'Total cost',
        monthlyReturn: 'Monthly return',
        annualReturn: 'Annual return',
      },
    },
    cta: {
      title: 'Ready to start your property analysis?',
      subtitle: 'Join thousands of investors who use our tools to make smart decisions.',
      button: 'Get started for free',
    },
    footer: {
      company: 'Leily',
      description: 'Your partner for smart real estate investments',
      links: {
        about: 'About us',
        contact: 'Contact',
        privacy: 'Privacy',
        terms: 'Terms',
      },
      contact: {
        title: 'Contact us',
        email: 'contact@aproposbolig.no',
        phone: '+47 123 45 678',
      },
      social: {
        title: 'Follow us',
      },
      copyright: '© 2025 Leily. All rights reserved.',
    },
    auth: {
      signIn: 'Sign in',
      signUp: 'Sign up',
      signOut: 'Sign out',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm password',
      fullName: 'Full name',
      welcome: 'Welcome!',
      welcomeBack: 'Welcome back!',
      signInToAccount: 'Sign in to your account',
      getStarted: 'Get started',
      chooseSignInMethod: 'Choose sign in method',
      continueWithGoogle: 'Continue with Google',
      continueWithFacebook: 'Continue with Facebook',
      orContinueWith: 'Or continue with',
      passwordMismatch: 'Passwords do not match',
      signInSuccess: 'Sign in successful',
      signUpSuccess: 'Sign up successful! Check your email for confirmation.',
      success: 'Success',
      learnAboutPlans: 'Learn about our subscription plans',
    },
    dashboard: {
      welcome: 'Welcome',
      user: 'User',
      welcomeMessage: 'Here\'s an overview of your properties and rentals.',
      proPlan: 'Pro Plan',
      freePlan: 'Free Plan',
      upgrade: 'Upgrade',
      properties: 'Properties',
      totalProperties: 'Total properties',
      tenants: 'Tenants',
      totalTenants: 'Total tenants',
      activeLeases: 'Active leases',
      currentlyActive: 'Currently active',
      monthlyIncome: 'Monthly income',
      totalMonthlyRent: 'Total monthly rent',
      upcomingExpirations: 'Upcoming expirations',
      leasesExpiringSoon: 'leases expiring soon',
      viewLeases: 'View leases',
      quickActions: 'Quick actions',
      addProperty: 'Add property',
      addPropertyDesc: 'Register a new property in the system',
      addTenant: 'Add tenant',
      addTenantDesc: 'Register a new tenant',
      createLease: 'Create lease',
      createLeaseDesc: 'Create new lease agreement',
      recentActivity: 'Recent activity',
      recentActivityDesc: 'View recent changes in the system',
      noRecentActivity: 'No recent activity to show',
    },
    pricing: {
      choosePlan: 'Choose your plan',
      planDescription: 'Get access to professional property analysis and rental management.',
      freePlan: 'Free',
      freeDescription: 'Perfect for getting started with property analysis',
      proPlan: 'Pro',
      proDescription: 'Everything you need for professional rental business',
      month: 'month',
      mostPopular: 'Most popular',
      getStarted: 'Get started',
      upgradeToPro: 'Upgrade to Pro',
      currentPlan: 'Current plan',
      unlimitedAnalysis: 'Unlimited analysis',
      basicReports: 'Basic reports',
      communitySupport: 'Community support',
      pdfExports: 'PDF export of analysis',
      rentalManagement: 'Rental management',
      tenantTracking: 'Tenant tracking',
      leaseDocuments: 'Lease agreements and documents',
      depositTracking: 'Deposit tracking',
      prioritySupport: 'Priority customer support',
      advancedReports: 'Advanced reports',
      pdfExportNote: 'PDF export for free users:',
      pdfExportPrice: '20 kr per analysis via Vipps',
      faq: 'Frequently asked questions',
      faqQ1: 'Can I change plans later?',
      faqA1: 'Yes, you can upgrade or downgrade your plan at any time from your profile.',
      faqQ2: 'What does rental management include?',
      faqA2: 'Complete system for managing properties, tenants, lease agreements, and deposits.',
      faqQ3: 'Is there a commitment for the Pro plan?',
      faqA3: 'No, you can cancel your subscription at any time without commitment.',
    },
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  translations: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('no');

  const contextValue = {
    language,
    setLanguage,
    translations: translations[language],
  };

  return (
    <LanguageContext.Provider value={contextValue}>
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