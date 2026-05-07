import { useState, useCallback } from 'react';

/** Safely parse a numeric string, returning 0 for empty/invalid values */
const safeFloat = (value: string | number | undefined | null): number => {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = typeof value === 'number' ? value : parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

interface CalculatorData {
  // Basic data
  propertyType: string;
  tomannsboligType: string; // 'vertikaldelt' or 'horisontaldelt'
  totalPrice: string;
  equity: string;
  isRental: boolean;
  expectedAnnualRent: string;
  interestRate: string;
  loanAmount: string;
  loanPeriod: string;
  
  // Property details
  address: string;
  
  // Expenses
  municipalFees: string;
  electricityMonthly: string;
  insurance: string;
  sharedExpenses: string;
  commonCosts: string;
  
  // Renovation
  isRenovation: boolean;
  renovationCost: string;
  postRenovationValue: string;
  
  // External/Private Lender
  hasExternalLender: boolean;
  externalLenderName: string;
  covenantFile: File | null;
  covenantFileUrl: string;
  
  // Rent estimation tracking
  isRentAutoEstimated: boolean;
  
  // Module activation tracking
  activatedModules: Set<string>;
  moduleInputs: { [key: string]: { [field: string]: boolean } };
}

const initialData: CalculatorData = {
  propertyType: "",
  tomannsboligType: "vertikaldelt",
  totalPrice: "",
  equity: "",
  isRental: false,
  expectedAnnualRent: "",
  interestRate: "",
  loanAmount: "",
  loanPeriod: "",
  
  address: "",
  
  municipalFees: "",
  electricityMonthly: "",
  insurance: "",
  sharedExpenses: "",
  commonCosts: "",
  
  isRenovation: false,
  renovationCost: "200000",
  postRenovationValue: "2800000",
  
  hasExternalLender: false,
  externalLenderName: "",
  covenantFile: null,
  covenantFileUrl: "",
  
  isRentAutoEstimated: false,
  
  activatedModules: new Set(),
  moduleInputs: {}
};

export const useCalculatorData = () => {
  const [data, setData] = useState<CalculatorData>(initialData);
  
  const updateField = useCallback((field: string, value: unknown, moduleId?: string) => {
    setData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Track module activation if moduleId is provided
      if (moduleId) {
        const newModuleInputs = { ...prev.moduleInputs };
        if (!newModuleInputs[moduleId]) {
          newModuleInputs[moduleId] = {};
        }
        newModuleInputs[moduleId][field] = true;
        
        // Add module to activated modules
        const newActivatedModules = new Set(prev.activatedModules);
        newActivatedModules.add(moduleId);
        
        return {
          ...newData,
          moduleInputs: newModuleInputs,
          activatedModules: newActivatedModules
        };
      }
      
      return newData;
    });
  }, []);
  
  const isModuleActivated = useCallback((moduleId: string) => {
    return data.activatedModules.has(moduleId);
  }, [data.activatedModules]);
  
  const getModuleData = useCallback((moduleId: string) => {
    if (!isModuleActivated(moduleId)) return null;
    
    // Return relevant data based on module type
    switch (moduleId) {
      case 'Lønnsomhetsanalyse':
        return {
          propertyValue: parseFloat(data.totalPrice),
          monthlyRent: parseFloat(data.expectedAnnualRent) / 12,
          loanAmount: parseFloat(data.loanAmount),
          calculatorMode: data.isRental ? 'investment' : 'private',
          // Add calculated values
          grossYield: ((parseFloat(data.expectedAnnualRent)) / parseFloat(data.totalPrice)) * 100,
          score: 75 // This would be calculated based on various factors
        };
        
      case 'Avanserte beregninger': {
        const totalExpenses = parseFloat(data.municipalFees) + parseFloat(data.electricityMonthly) + 
                             parseFloat(data.insurance) + parseFloat(data.sharedExpenses);
        return {
          capRate: 6.5, // Would be calculated
          cashOnCashReturn: 8.2, // Would be calculated  
          netOperatingIncome: (parseFloat(data.expectedAnnualRent) / 12 - totalExpenses) * 12,
          totalReturnPercentage: 12.5 // Would be calculated
        };
      }
        
      case 'Markedsanalyse':
        return {
          propertyValue: parseFloat(data.totalPrice),
          monthlyRent: parseFloat(data.expectedAnnualRent) / 12,
          averageAreaPrice: 2800000, // Would come from market data
          averageAreaRent: 20000, // Would come from market data
          priceComparison: ((parseFloat(data.totalPrice) - 2800000) / 2800000) * 100,
          rentComparison: ((parseFloat(data.expectedAnnualRent) / 12 - 20000) / 20000) * 100,
          rentYield: ((parseFloat(data.expectedAnnualRent)) / parseFloat(data.totalPrice)) * 100,
          marketRentYield: ((20000 * 12) / 2800000) * 100
        };
        
      case 'Risikoevaluering': {
        const loanToValue = (parseFloat(data.loanAmount) / parseFloat(data.totalPrice)) * 100;
        return {
          loanToValue,
          debtServiceCoverage: 1.4, // Would be calculated
          cashFlowBuffer: 5000, // Would be calculated
          scenarios: [
            { title: 'Renteøkning 2%', impact: -3000, severity: 'Moderat' },
            { title: '3 måneder leieledie', impact: -54000, severity: 'Høy' }
          ]
        };
      }
        
      case 'Avkastningsanalyse':
        return {
          grossYield: ((parseFloat(data.expectedAnnualRent)) / parseFloat(data.totalPrice)) * 100,
          netYield: 5.2, // Would be calculated
          monthlyNet: parseFloat(data.expectedAnnualRent) / 12 - 4000, // Simplified
          projectionYears: 10,
          projectedValue: parseFloat(data.totalPrice) * 1.4, // 4% annual growth
          projectedRent: (parseFloat(data.expectedAnnualRent) / 12) * 1.3, // 3% annual growth
          annualizedReturn: 8.5 // Would be calculated
        };
        
      default:
        return null;
    }
  }, [data, isModuleActivated]);
  
  const getReportData = useCallback(() => {
    const totalExpenses = safeFloat(data.municipalFees) + safeFloat(data.electricityMonthly) +
                          safeFloat(data.insurance) + safeFloat(data.sharedExpenses);

    const monthlyInterest = safeFloat(data.interestRate) / 100 / 12;
    const numberOfPayments = safeFloat(data.loanPeriod) * 12;
    const loanAmount = safeFloat(data.loanAmount);
    const totalPrice = safeFloat(data.totalPrice);
    const annualRent = safeFloat(data.expectedAnnualRent);

    let monthlyLoanPayment = 0;
    if (numberOfPayments > 0 && monthlyInterest > 0 && loanAmount > 0) {
      monthlyLoanPayment = loanAmount *
        (monthlyInterest * Math.pow(1 + monthlyInterest, numberOfPayments)) /
        (Math.pow(1 + monthlyInterest, numberOfPayments) - 1);
    }

    const monthlyCashFlow = data.isRental
      ? annualRent / 12 - totalExpenses - monthlyLoanPayment
      : -totalExpenses - monthlyLoanPayment;

    const grossYield = data.isRental && totalPrice > 0
      ? (annualRent / totalPrice) * 100
      : 0;

    return {
      basicData: {
        propertyValue: totalPrice,
        monthlyRent: annualRent / 12,
        loanAmount,
        expenses: totalExpenses,
        monthlyLoanPayment,
        monthlyCashFlow,
        grossYield,
        calculatorMode: data.isRental ? 'investment' : 'private',
        loanToValue: totalPrice > 0 ? (loanAmount / totalPrice) * 100 : 0
      },
      profitabilityData: isModuleActivated('Lønnsomhetsanalyse') ? getModuleData('Lønnsomhetsanalyse') : null,
      advancedData: isModuleActivated('Avanserte beregninger') ? getModuleData('Avanserte beregninger') : null,
      marketData: isModuleActivated('Markedsanalyse') ? getModuleData('Markedsanalyse') : null,
      riskData: isModuleActivated('Risikoevaluering') ? getModuleData('Risikoevaluering') : null,
      yieldData: isModuleActivated('Avkastningsanalyse') ? getModuleData('Avkastningsanalyse') : null,
      activatedModules: Array.from(data.activatedModules)
    };
  }, [data, isModuleActivated, getModuleData]);
  
  return {
    data,
    updateField,
    isModuleActivated,
    getModuleData,
    getReportData
  };
};