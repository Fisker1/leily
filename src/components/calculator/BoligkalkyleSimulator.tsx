import React, { useRef, useEffect, useState, useCallback } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, Calculator, CreditCard, BarChart3, AlertTriangle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { formatNumberWithSpaces } from '@/lib/utils';

// Register all Handsontable modules
registerAllModules();

interface BoligkalkyleSimulatorProps {
  data?: Record<string, any>;
  onDataChange?: (field: string, value: any) => void;
}

export const BoligkalkyleSimulator: React.FC<BoligkalkyleSimulatorProps> = ({
  data = {},
  onDataChange
}) => {
  const hotTableRef = useRef<any>(null);
  const [hotInstance, setHotInstance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'kalkyle' | 'lan' | 'oversikt' | 'risiko'>('kalkyle');

  // Modern color palette inspired by Apple design
  const colors = {
    primary: '#007AFF',      // iOS Blue
    secondary: '#5856D6',    // iOS Purple
    success: '#34C759',      // iOS Green
    warning: '#FF9500',      // iOS Orange
    danger: '#FF3B30',       // iOS Red
    background: '#F2F2F7',   // iOS Light Gray
    surface: '#FFFFFF',      // White
    text: '#1C1C1E',         // iOS Dark Gray
    textSecondary: '#8E8E93', // iOS Medium Gray
    border: '#C6C6C8',       // iOS Light Border
    accent: '#5AC8FA'        // iOS Light Blue
  };

  // Initialize component
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Main calculation sheet data (Kalkyle - 2025)
  const getKalkyleData = useCallback(() => {
    return [
      // Header
      ['', '', 'Privat kalkyle eiendomsinvestering', '', '', '', '', '', '', ''],
      
      // Address
      ['', '', data.address || 'Hafrsfjordgata 49', '', data.postalCode || '4010 Stavanger', '', '', '', '', ''],
      
      // Empty row
      ['', '', '', '', '', '', '', '', '', ''],
      
      // Main summary table
      ['', '', 'Verditakst', 'Lånesum', 'Lånebelastning', 'Avdragsfrie år', '', '', '', ''],
      ['', '', data.totalPrice || 7500000, data.loanAmount || 5766443, '76.89%', 0, '', '', '', ''],
      
      // Empty row
      ['', '', '', '', '', '', '', '', '', ''],
      
      // Avkastning ved boligkjøp section
      ['', '', 'Avkastning ved boligkjøp', '', '', '', '', '', '', ''],
      ['', '', 'Totalpris eiendom', 7688590, '', '', '', '', '', ''],
      ['', '', 'Rente (%)', data.interestRate || 6.5, '', '', '', '', '', ''],
      ['', '', 'Lån (kr)', 5766443, '', '', '', '', '', ''],
      ['', '', 'Egenkapital', 1922148, '', '', '', '', '', ''],
      ['', '', 'Lånebelastning kjøpesum', '75.00%', '', '', '', '', '', ''],
      ['', '', 'Leieinntekt per mnd', data.monthlyRent || 60000, '', '', '', '', '', ''],
      ['', '', 'Felleskostnader pr. mnd', '', '', '', '', '', '', ''],
      ['', '', 'Kommunale avgifter pr. m', 2231, '', '', '', '', '', ''],
      ['', '', 'Ledighet (3%)', 1800, '', '', '', '', '', ''],
      ['', '', 'Vedlikehold (5%)', 3000, '', '', '', '', '', ''],
      ['', '', 'Strøm, forsikring, diverse', 7694, '', '', '', '', '', ''],
      ['', '', 'Netto leie pr. mnd. (før sk)', 46875, '', '', '', '', '', ''],
      ['', '', 'Skatt (22%)', 10313, '', '', '', '', '', ''],
      ['', '', 'Netto leie etter skatt', 36563, '', '', '', '', '', ''],
      ['', '', 'Rentekostnad', 31051, '', '', '', '', '', ''],
      ['', '', 'Fradrag renter (22%)', 6831, '', '', '', '', '', ''],
      ['', '', 'Sum etter finanskost og sk', 12342, '', '', '', '', '', ''],
      ['', '', 'Netto pr. år', 148110, '', '', '', '', '', ''],
      ['', '', 'Avkastning egenkapitalen', '7.71%', '', '', '', '', '', ''],
      
      // Empty row
      ['', '', '', '', '', '', '', '', '', ''],
      
      // Cashflow per mnd section
      ['', '', '', '', 'Cashflow per mnd', '', '', '', '', ''],
      ['', '', '', '', 'Leieinntekt', 60000, '', '', '', ''],
      ['', '', '', '', 'Felleskost', '', '', '', '', ''],
      ['', '', '', '', 'Kom. Avg', 2231, '', '', '', ''],
      ['', '', '', '', 'Vedlikehold (5%)', 3000, '', '', '', ''],
      ['', '', '', '', 'Diverse', 7694, '', '', '', ''],
      ['', '', '', '', 'Skatt *', 10313, '', '', '', ''],
      ['', '', '', '', 'Ledighet (3%)', 1800, '', '', '', ''],
      ['', '', '', '', 'Renter og avdrag', 38985, '', '', '', ''],
      ['', '', '', '', 'Cashflow per mnd', -2423, '', '', '', ''],
      
      // Empty row
      ['', '', '', '', '', '', '', '', '', ''],
      
      // Nettoyield på eiendommen section
      ['', '', '', '', '', '', 'Nettoyield på eiendommen *', '', '', ''],
      ['', '', '', '', '', '', 'Leieinntekter', 720000, '', ''],
      ['', '', '', '', '', '', 'Driftskostnader', 157500, '', ''],
      ['', '', '', '', '', '', 'Netto leieinntekt', 562500, '', ''],
      ['', '', '', '', '', '', 'Kjøpesum', 7688590, '', ''],
      ['', '', '', '', '', '', 'Netto yield', '7.32%', '', ''],
      
      // Empty row
      ['', '', '', '', '', '', '', '', '', ''],
      
      // Note
      ['', '', 'Dette arket kopierer du og har et eget for hver eiendom og hvert år.', '', '', '', '', '', '', '']
    ];
  }, [data]);

  // Loan calculation sheet data (Lån - Kalkyle 2025)
  const getLanData = useCallback(() => {
    return [
      // Header
      ['', 'Lånebeløp og betingelser', '', '', '', '', '', '', '', ''],
      
      // Loan details
      ['', 'Lån', 5766443, '', '', '', '', '', '', ''],
      ['', 'Nominell rente per år (PA)', 6.5, '', '', '', '', '', '', ''],
      ['', 'Nedbetalingstid, antall år', 25, '', '', '', '', '', '', ''],
      ['', 'Avdragsfrie år', 0, '', '', '', '', '', '', ''],
      ['', 'Terminer per år', 12, '', '', '', '', '', '', ''],
      ['', 'Termingebyr', 50, '', '', '', '', '', '', ''],
      ['', 'Tinglysningsgebyr', '', '', '', '', '', '', '', ''],
      ['', 'Etableringsgebyr', 950, '', '', '', '', '', '', ''],
      ['', 'Inkludere gebyrer i lånebeløp?', 'Ja', '', '', '', '', '', '', ''],
      
      // Empty row
      ['', '', '', '', '', '', '', '', '', ''],
      
      // Cost summary
      ['', 'Avdrag, renter andre kostnader', '', '', '', '', '', '', '', ''],
      ['', 'Lånebeløp inkl gebyrer', 5766443, '', '', '', '', '', '', ''],
      ['', 'Avdrag og rente/termin', 38985, '', '', '', '', '', '', ''],
      ['', 'Nedbetalt i perioden', 11695630, '', '', '', '', '', '', ''],
      ['', 'Renter', 5929187, '', '', '', '', '', '', ''],
      ['', 'Etablering og tinglysning', 950, '', '', '', '', '', '', ''],
      ['', 'Sum kostnader', 5930137, '', '', '', '', '', '', ''],
      ['', 'Total kostnad i % av lånesum', '102.8', '', '', '', '', '', '', ''],
      ['', 'Termingebyr utgjør', 15000, '', '', '', '', '', '', ''],
      
      // Empty row
      ['', '', '', '', '', '', '', '', '', ''],
      
      // Amortization table header
      ['', '', '', '', '', 'Termin', 'Terminbeløp', 'Renter', 'Avdrag', 'Restgjeld'],
      
      // Initial debt
      ['', '', '', '', '', 0, '', '', '', 5766443],
      
      // First few installments
      ['', '', '', '', '', 1, 38985, 31285, 7701, 5758742],
      ['', '', '', '', '', 2, 38985, 31199, 7786, 5750956],
      ['', '', '', '', '', 3, 38985, 31112, 7873, 5743083],
      ['', '', '', '', '', 4, 38985, 31025, 7960, 5735123],
      ['', '', '', '', '', 5, 38985, 30937, 8048, 5727075],
      
      // Annual summary header
      ['', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', 'Periode', 'Renter pr. Å', 'Avdrag pr. Å', '', ''],
      ['', '', '', '', '', 'År 1', 372616, 95210, '', ''],
      ['', '', '', '', '', 'År 2', 360234, 107592, '', ''],
      ['', '', '', '', '', 'År 3', 347852, 119974, '', ''],
      ['', '', '', '', '', 'År 4', 335470, 132356, '', ''],
      ['', '', '', '', '', 'År 5', 323088, 144738, '', '']
    ];
  }, []);

  // Total overview sheet data
  const getOversiktData = useCallback(() => {
    return [
      // Header
      ['', '', 'Eiendomsinvesteringer for Leily AS', '', '', '', '', '', '', '', '', '', '', ''],
      
      // Property columns
      ['', '', 'Hafrsfjordgata 49', '', 'Adresse 2', '', 'Adresse 3', '', 'Adresse 4', '', 'Adresse 5', '', 'Total sum', ''],
      
      // Empty row
      ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      
      // Investment details
      ['', '', 'Verdi', 7500000, '', '', '', '', '', '', '', '', 7500000, ''],
      ['', '', 'Lån', 6000000, '', '', '', '', '', '', '', '', 6000000, ''],
      ['', '', 'Rente', 5.68, '', '', '', '', '', '', '', '', 5.68, ''],
      ['', '', 'Lånebelastning pr. enhet', '80%', '', '', '', '', '', '', '', '', '80%', ''],
      ['', '', 'EK', 1500000, '', '', '', '', '', '', '', '', 1500000, ''],
      ['', '', 'Lånebelastning totalt', '', '', '', '', '', '', '', '', '', '80%', ''],
      
      // Empty row
      ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      
      // Expenses section
      ['', '', 'UTGIFTER: pr. år', '', '', '', '', '', '', '', '', '', '', ''],
      ['', '', 'Renteutgifter', 340800, '', '', '', '', '', '', '', '', 340800, ''],
      ['', '', 'Felles utgifter', 3008, '', '', '', '', '', '', '', '', 3008, ''],
      ['', '', 'Kommunale avgifter', 17840, '', '', '', '', '', '', '', '', 17840, ''],
      ['', '', 'Forsikring', 2180, '', '', '', '', '', '', '', '', 2180, ''],
      ['', '', 'Strøm', 575, '', '', '', '', '', '', '', '', 575, ''],
      ['', '', 'Avdrag *', 35544, '', '', '', '', '', '', '', '', 35544, ''],
      ['', '', 'Utgifter pr. enhet:', 399947, '', '', '', '', '', '', '', '', 399947, ''],
      
      // Empty row
      ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      
      // Income section
      ['', '', 'INNTEKTER: pr. år', '', '', '', '', '', '', '', '', '', '', ''],
      ['', '', 'Leieinntekt', '-', '', '', '', '', '', '', '', '', '-', ''],
      ['', '', 'Diverse inntekt', '-', '', '', '', '', '', '', '', '', '-', ''],
      ['', '', 'Inntekter pr. enhet', '-', '', '', '', '', '', '', '', '', '-', ''],
      
      // Empty row
      ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      
      // Results section
      ['', '', 'RESULTAT: før skatt', -399947, '', '', '', '', '', '', '', '', -399947, ''],
      ['', '', 'Skatt 22%', -8799, '', '', '', '', '', '', '', '', -8799, ''],
      ['', '', 'RESULTAT: etter skatt', -391148, '', '', '', '', '', '', '', '', -391148, ''],
      ['', '', 'Rentefradrag', 74976, '', '', '', '', '', '', '', '', 74976, ''],
      ['', '', 'Resultat e/ rentefradrag', -316172, '', '', '', '', '', '', '', '', -316172, ''],
      ['', '', 'Pr. Mnd.', -26348, '', '', '', '', '', '', '', '', -26348, '']
    ];
  }, []);

  // Risk assessment sheet data
  const getRisikoData = useCallback(() => {
    return [
      // Header
      ['', 'RISIKOVURDERING OG PACE-PLAN', '', '', '', '', '', '', '', ''],
      
      // Empty row
      ['', '', '', '', '', '', '', '', '', ''],
      
      // ROS section
      ['', 'RISIKO- OG SÅRBARHETSANALYSE (ROS)', '', '', '', '', '', '', '', ''],
      ['', 'Hendelse / risiko', 'Sannsynlighet (1-5)', 'Konsekvens (1-5)', 'Risikonivå', 'Kommentar / beskrivelse', 'Tiltak / reduksjon', '', '', ''],
      ['', 'Ledighet / tap av leietakere', 2, 3, 6, 'Kan føre til lavere kontantstrøm i perioder', 'Opprette bufferkonto, aktiv markedsføring', '', '', ''],
      ['', 'Renteøkning', 2, 4, 8, 'Rente stiger over 7%, høyere månedlige kostnader', 'Vurdere fastrente eller ekstra nedbetaling', '', '', ''],
      ['', 'Uforutsett vedlikehold', 4, 3, 12, 'Tak, rør eller bad krever akutt utbedring', 'Opprette vedlikeholdsfond', '', '', ''],
      ['', 'Endring i boligmarkedet', 2, 4, 8, 'Lavere verdi ved salg', 'Langsiktig investeringshorisont', '', '', ''],
      ['', 'Forsikringskostnader øker', 3, 2, 6, 'Prisjusteringer fra forsikringsselskap', 'Sammenligne forsikring årlig', '', '', ''],
      
      // Empty row
      ['', '', '', '', '', '', '', '', '', ''],
      
      // PACE-PLAN section
      ['', 'PACE-PLAN (Primary, Alternate, Contingency, Emergency)', '', '', '', '', '', '', '', ''],
      ['', 'Risiko / situasjon', 'Primary (hovedløsning)', 'Alternate (alternativ)', 'Contingency (reserve)', 'Emergency (kriseplan)', 'Ansvarlig', '', '', ''],
      ['', 'Ledighet', 'Kontrakter med lengre varighet', 'Korttidsutleie (Airbnb)', 'Forbedre markedsføring', 'Prisjustering', 'Susanne Hamre - Utleie forvalter', '', '', ''],
      ['', 'Renteøkning', 'Forhandle lavere rente', 'Fast rente', 'Skyte inn privat kapital', 'Selge eiendom', 'Anders Lundøy - Daglig leder', '', '', ''],
      ['', 'Vedlikehold', 'Forebyggende vedlikehold', 'Utføre vedlikehold selv', 'Leie inn entreprenør', 'Selge eiendom', 'Anders Lundøy - Daglig leder', '', '', ''],
      ['', 'Tap av leieinntekt', 'Bufferkonto - Privat', 'Øke private lån', 'Forespørsel om investor lån', 'Selge eiendom', 'Anders Lundøy - Daglig leder', '', '', ''],
      
      // Empty row
      ['', '', '', '', '', '', '', '', '', ''],
      
      // Summary section
      ['', 'OPPSUMMERING OG TOTAL RISIKOVURDERING', '', '', '', '', '', '', '', ''],
      ['', 'Gjennomsnittlig risikonivå', 8, '', '', '', '', '', '', ''],
      ['', 'Kommentar til risikobilde', 'Samlet risiko vurderes som middels. Tiltak bør revideres årlig eller ved store markedsendringer.', '', '', '', '', '', '', '']
    ];
  }, []);

  // Get data based on active tab
  const getCurrentData = useCallback(() => {
    switch (activeTab) {
      case 'kalkyle':
        return getKalkyleData();
      case 'lan':
        return getLanData();
      case 'oversikt':
        return getOversiktData();
      case 'risiko':
        return getRisikoData();
      default:
        return getKalkyleData();
    }
  }, [activeTab, getKalkyleData, getLanData, getOversiktData, getRisikoData]);

  // Define which cells are editable
  const getEditableCells = useCallback(() => {
    const editableCells: { [key: string]: boolean } = {};
    
    // Main calculation sheet
    const editableCellsList = [
      '2,2', '2,4', // Address, postal code
      '4,2', '4,3', '4,5', // Verditakst, Lånesum, Avdragsfrie år
      '8,3', '9,3', '10,3', // Totalpris, Rente, Lån
      '12,3', '13,3', '14,3', '17,3', // Leieinntekt, Felleskost, Kom.avg, Diverse
      '29,5', '30,5', '31,5', '33,5', // Cashflow inputs
      '40,7', '43,7', // Nettoyield inputs
      
      // Loan sheet
      '2,2', '3,2', '4,2', '5,2', '6,2', '7,2', '9,2', // Loan parameters
      
      // Overview sheet
      '3,2', '3,4', '3,6', '3,8', '3,10', // Property values
      '4,2', '4,4', '4,6', '4,8', '4,10', // Property values
      '5,2', '5,4', '5,6', '5,8', '5,10', // Loan amounts
      
      // Risk sheet
      '4,2', '4,3', '4,4', '4,5', '4,6', // Risk entries
      '5,2', '5,3', '5,4', '5,5', '5,6', // Risk entries
      '6,2', '6,3', '6,4', '6,5', '6,6', // Risk entries
      '7,2', '7,3', '7,4', '7,5', '7,6', // Risk entries
      '8,2', '8,3', '8,4', '8,5', '8,6'  // Risk entries
    ];
    
    editableCellsList.forEach(cellKey => {
      editableCells[cellKey] = true;
    });
    
    return editableCells;
  }, []);

  // Define cell styling
  const getCellStyling = useCallback(() => {
    const cellStyle: { [key: string]: any } = {};
    
    // Main headers
    cellStyle['0,2'] = { className: 'main-header' };
    cellStyle['0,1'] = { className: 'main-header' };
    
    // Section headers
    const sectionRows = [7, 28, 39]; // Avkastning ved boligkjøp, Cashflow per mnd, Nettoyield
    sectionRows.forEach(row => {
      cellStyle[`${row},2`] = { className: 'section-header' };
    });
    
    // Table headers
    cellStyle['3,2'] = { className: 'table-header' };
    cellStyle['3,3'] = { className: 'table-header' };
    cellStyle['3,4'] = { className: 'table-header' };
    cellStyle['3,5'] = { className: 'table-header' };
    
    // Calculated cells
    const calculatedCells = [
      '4,4', // Lånebelastning
      '10,3', // Lån (kr)
      '11,3', // Egenkapital
      '12,3', // Lånebelastning kjøpesum
      '16,3', // Ledighet (3%)
      '17,3', // Vedlikehold (5%)
      '19,3', // Netto leie (før skatt)
      '20,3', // Skatt (22%)
      '21,3', // Netto leie etter skatt
      '22,3', // Rentekostnad
      '23,3', // Fradrag renter (22%)
      '24,3', // Sum etter finanskost og sk
      '25,3', // Netto pr. år
      '26,3', // Avkastning egenkapitalen
      '29,5', '30,5', '31,5', '32,5', '33,5', '34,5', '35,5', '36,5', '37,5', // Cashflow
      '40,7', '41,7', '42,7', '43,7', '44,7' // Nettoyield
    ];
    
    calculatedCells.forEach(cellKey => {
      cellStyle[cellKey] = { className: 'calculated-cell' };
    });
    
    // Labels (column B)
    for (let row = 2; row <= 44; row++) {
      if (!cellStyle[`${row},2`]) {
        cellStyle[`${row},2`] = { className: 'label-cell' };
      }
    }
    
    return cellStyle;
  }, []);

  // Handle cell changes
  const handleAfterChange = useCallback((changes: any) => {
    if (!changes || !onDataChange) return;
    
    changes.forEach((change: any) => {
      const [row, col, oldValue, newValue] = change;
      
      // Map changes to property data
      const fieldMap: { [key: string]: string } = {
        '2,2': 'address',
        '2,4': 'postalCode',
        '4,2': 'totalPrice',
        '4,3': 'loanAmount',
        '4,5': 'interestOnlyYears',
        '8,3': 'totalPrice',
        '9,3': 'interestRate',
        '10,3': 'loanAmount',
        '12,3': 'monthlyRent',
        '13,3': 'commonCosts',
        '14,3': 'municipalFees',
        '17,3': 'otherExpenses'
      };
      
      const fieldKey = `${row},${col}`;
      const fieldName = fieldMap[fieldKey];
      
      if (fieldName) {
        onDataChange(fieldName, newValue);
      }
    });
  }, [onDataChange]);

  // Export as PNG
  const handleExportPNG = useCallback(async () => {
    if (!hotInstance) return;
    
    try {
      const tableElement = hotInstance.rootElement;
      const canvas = await html2canvas(tableElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: colors.surface,
        logging: false
      });
      
      const link = document.createElement('a');
      link.download = `boligkalkyle-${activeTab}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error exporting PNG:', error);
    }
  }, [hotInstance, activeTab, colors.surface]);

  // Handsontable configuration
  const hotSettings = {
    data: getCurrentData(),
    colHeaders: false,
    rowHeaders: false,
    width: '100%',
    height: 600,
    licenseKey: 'non-commercial-and-evaluation',
    colWidths: [40, 40, 180, 100, 40, 100, 40, 100, 40, 100], // Smaller column widths
    cells: (row: number, col: number) => {
      const editableCells = getEditableCells();
      const cellStyle = getCellStyling();
      const cellKey = `${row},${col}`;
      
      // Determine cell type and formatting
      let cellType = 'text';
      let format = null;
      
      // Numeric cells
      if (col > 2 && row > 0) {
        const data = getCurrentData();
        const cellValue = data[row]?.[col];
        
        if (typeof cellValue === 'number') {
          cellType = 'numeric';
          format = '0,0';
        }
      }
      
      return {
        readOnly: !editableCells[cellKey],
        className: cellStyle[cellKey]?.className || '',
        type: cellType,
        format: format,
        ...cellStyle[cellKey]
      };
    },
    afterChange: handleAfterChange,
    afterInit: () => {
      const instance = hotTableRef.current?.hotInstance;
      if (instance) {
        setHotInstance(instance);
      }
    },
    contextMenu: false,
    manualColumnResize: true,
    manualRowResize: true,
    stretchH: 'none' as const, // Changed from 'all' to 'none' to prevent overflow
    wordWrap: true, // Enable word wrap
    preventOverflow: 'horizontal' as const,
    columnSorting: false,
    filters: false,
    dropdownMenu: false,
    comments: false,
    fillHandle: false,
    undoRedo: true,
    overflow: 'hidden' as const // Add overflow hidden
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="p-4 border-b border-border/50 bg-card flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            <span className="font-semibold text-lg">Boligkalkyle Simulator</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Laster kalkyle...</p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'kalkyle', label: 'Kalkyle', icon: Calculator },
    { key: 'lan', label: 'Lån', icon: CreditCard },
    { key: 'oversikt', label: 'Oversikt', icon: BarChart3 },
    { key: 'risiko', label: 'Risiko', icon: AlertTriangle }
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Modern header with tabs */}
      <div className="p-4 border-b border-border/50 bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            <span className="font-semibold text-lg">Boligkalkyle Simulator</span>
          </div>
          <Button onClick={handleExportPNG} size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Last ned bilde
          </Button>
        </div>
        
        {/* Modern tab navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Spreadsheet */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="border rounded-xl overflow-hidden shadow-sm h-full" style={{ borderColor: colors.border }}>
          <div className="h-full overflow-auto">
            <HotTable
              ref={hotTableRef}
              {...hotSettings}
            />
          </div>
        </div>
      </div>

      {/* Modern styles */}
      <style>{`
        .handsontable {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          font-size: 14px;
          line-height: 1.4;
          max-width: 100%;
          overflow: hidden;
        }
        
        .handsontable .htCore {
          max-width: 100%;
          overflow: hidden;
        }
        
        .handsontable td {
          border: 1px solid ${colors.border};
          padding: 8px 12px;
          font-size: 13px;
          transition: all 0.2s ease;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .handsontable td:hover {
          background-color: ${colors.background};
        }
        
        .handsontable .htCore td.main-header {
          background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
          color: white;
          font-weight: 600;
          text-align: center;
          font-size: 14px;
          letter-spacing: 0.3px;
          white-space: normal;
        }
        
        .handsontable .htCore td.section-header {
          background: linear-gradient(135deg, ${colors.secondary}, ${colors.accent});
          color: white;
          font-weight: 600;
          font-size: 13px;
          letter-spacing: 0.2px;
          white-space: normal;
        }
        
        .handsontable .htCore td.table-header {
          background: ${colors.primary};
          color: white;
          font-weight: 600;
          text-align: center;
          font-size: 12px;
        }
        
        .handsontable .htCore td.label-cell {
          background-color: ${colors.background};
          color: ${colors.text};
          font-weight: 500;
          text-align: left;
          white-space: normal;
        }
        
        .handsontable .htCore td.calculated-cell {
          background-color: ${colors.surface};
          color: ${colors.text};
          text-align: right;
          font-weight: 400;
        }
        
        .handsontable .htCore td[data-cell-type="numeric"] {
          text-align: right !important;
        }
        
        .handsontable .htCore td[data-cell-type="text"] {
          text-align: left !important;
        }
        
        .handsontable .htCore {
          border-collapse: separate;
          border-spacing: 0;
          table-layout: fixed;
        }
        
        .handsontable .htCore td {
          border-right: 1px solid ${colors.border};
          border-bottom: 1px solid ${colors.border};
        }
        
        .handsontable .htCore td:last-child {
          border-right: none;
        }
        
        .handsontable .htCore tr:last-child td {
          border-bottom: none;
        }
        
        /* Ensure the table doesn't overflow its container */
        .handsontable .ht_master {
          max-width: 100%;
          overflow: hidden;
        }
        
        .handsontable .ht_master .wtHolder {
          max-width: 100%;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default BoligkalkyleSimulator;