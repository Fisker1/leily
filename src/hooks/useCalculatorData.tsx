import { useState, useCallback } from 'react';

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
  
  municipalFees: "",
  electricityMonthly: "",
  insurance: "",
  sharedExpenses: "",
  commonCosts: "",
  
  isRenovation: false,
  renovationCost: "200000",
  postRenovationValue: "2800000",
  
  activatedModules: new Set(),
  moduleInputs: {}
};

export const useCalculatorData = () => {
  const [data, setData] = useState<CalculatorData>(initialData);
  
  const updateField = useCallback((field: string, value: any, moduleId?: string) => {
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
    const totalExpenses = parseFloat(data.municipalFees) + parseFloat(data.electricityMonthly) + 
                          parseFloat(data.insurance) + parseFloat(data.sharedExpenses);
                          
    const monthlyInterest = parseFloat(data.interestRate) / 100 / 12;
    const numberOfPayments = parseFloat(data.loanPeriod) * 12;
    const monthlyLoanPayment = parseFloat(data.loanAmount) * 
      (monthlyInterest * Math.pow(1 + monthlyInterest, numberOfPayments)) / 
      (Math.pow(1 + monthlyInterest, numberOfPayments) - 1);
      
    const monthlyCashFlow = data.isRental
      ? parseFloat(data.expectedAnnualRent) / 12 - totalExpenses - monthlyLoanPayment
      : -totalExpenses - monthlyLoanPayment;
      
    const grossYield = data.isRental
      ? (parseFloat(data.expectedAnnualRent) / parseFloat(data.totalPrice)) * 100
      : 0;

    return {
      basicData: {
        propertyValue: parseFloat(data.totalPrice),
        monthlyRent: parseFloat(data.expectedAnnualRent) / 12,
        loanAmount: parseFloat(data.loanAmount),
        expenses: totalExpenses,
        monthlyLoanPayment,
        monthlyCashFlow,
        grossYield,
        calculatorMode: data.isRental ? 'investment' : 'private',
        loanToValue: (parseFloat(data.loanAmount) / parseFloat(data.totalPrice)) * 100
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