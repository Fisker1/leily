import React, { useRef, useEffect, useState, useCallback } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Calculator, CreditCard, BarChart3, AlertTriangle, Home } from 'lucide-react';
import * as XLSX from 'xlsx';
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
  const [activeTab, setActiveTab] = useState<'eiendom' | 'kalkyle' | 'lan' | 'oversikt' | 'risiko'>('eiendom');

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

  // Property information sheet data - Compact A4 layout
  const getEiendomData = useCallback(() => {
    return [
      // Row 1: Section headers
      ['Eiendomsinformasjon', '', 'Låneinformasjon', '', 'Investeringsinformasjon', '', '', ''],
      
      // Row 2: Address
      ['Adresse', data.address || 'Hafrsfjordgata 49', 'Lånebeløp', data.loanAmount || '6 000 000', 'Kjøpesum', data.totalPrice || '7 500 000', '', ''],
      
      // Row 3: Postal code and city
      ['Postnummer og sted', data.postalCode || '4010 Stavanger', 'Rente', data.interestRate || '5.5%', 'Egenkapital', '1 500 000', '', ''],
      
      // Row 4: Property type
      ['Eiendomstype', 'Leilighet', 'Løpetid', '25 år', 'Lånebelastning', '80%', '', ''],
      
      // Row 5: Size
      ['Størrelse', '85 m²', 'Avdragsfrie år', '0', 'Månedlig leie', data.monthlyRent || '45 000', '', ''],
      
      // Row 6: Year built
      ['Byggeår', '2015', '', '', '', '', '', ''],
      
      // Row 7: Empty
      ['', '', '', '', '', '', '', ''],
      
      // Row 8: Key property information header
      ['Nøkkelinformasjon om eiendommen', '', '', '', '', '', '', ''],
      
      // Row 9: Property value
      ['Verditakst', '7 500 000', '', '', '', '', '', ''],
      
      // Row 10: Market value per m²
      ['Verdi per m²', '88 235', '', '', '', '', '', ''],
      
      // Row 11: Rental yield
      ['Leieavkastning', '7.2%', '', '', '', '', '', ''],
      
      // Row 12: Property condition
      ['Tilstand', 'God', '', '', '', '', '', ''],
      
      // Row 13: Energy rating
      ['Energimerking', 'B', '', '', '', '', '', ''],
      
      // Row 14: Empty
      ['', '', '', '', '', '', '', ''],
      
      // Row 15: Contact information header
      ['Kontaktinformasjon', '', '', '', '', '', '', ''],
      
      // Row 16: Buyer name
      ['Kjøper', 'Anders Lundøy', '', '', '', '', '', ''],
      
      // Row 17: Buyer email
      ['E-post', 'anders@leily.no', '', '', '', '', '', ''],
      
      // Row 18: Buyer phone
      ['Telefon', '+47 123 45 678', '', '', '', '', '', ''],
      
      // Row 19: Empty rows for natural ending
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '']
    ];
  }, [data]);

  // Main calculation sheet data (Kalkyle - 2025) - Ultra-compact layout
  const getKalkyleData = useCallback(() => {
    return [
      // Row 1: Section headers
      ['Avkastning ved boligkjøp', '', '', 'Pengestrøm', '', 'Nettoavkastning', '', ''],
      
      // Row 2: Avkastning section - Totalpris eiendom
      ['Totalpris eiendom', data.totalPrice || '7 688 590', '', 'Leieinntekt', '60 000', 'Leieinntekter', '720 000', ''],
      
      // Row 3: Rente
      ['Rente', data.interestRate || '6,5', '', 'Felleskost', '', 'Driftskostnader', '157 500', ''],
      
      // Row 4: Lån
      ['Lån', data.loanAmount || '5 766 443', '', 'Kom. Avg', '2 231', 'Netto leieinntekt', '562 500', ''],
      
      // Row 5: Egenkapital
      ['Egenkapital', '1 922 148', '', 'Vedlikehold (5%)', '2 000', 'Kjøpesum', '7 688 590', ''],
      
      // Row 6: Lånebelastning kjøpesum
      ['Lånebelastning kjøpesum', '75,00%', '', 'Diverse', '7 694', 'Netto yield', '7,32%', ''],
      
      // Row 7: Leieinntekt per mnd
      ['Leieinntekt per mnd', data.monthlyRent || '60 000', '', 'Skatt *', '10 313', '', '', ''],
      
      // Row 8: Felleskostnader pr. mnd
      ['Felleskostnader pr. mnd', '', '', 'Ledighet (3%)', '1 200', '', '', ''],
      
      // Row 9: Kommunale avgifter pr. m
      ['Kommunale avgifter pr. m', '2 231', '', 'Renter og avdrag', '38 985', '', '', ''],
      
      // Row 10: Ledighet (3%)
      ['Ledighet (3%)', '1 200', '', 'Cashflow per mnd', '-2 423', '', '', ''],
      
      // Row 11: Vedlikehold (5%)
      ['Vedlikehold (5%)', '2 000', '', '', '', '', '', ''],
      
      // Row 12: Strøm, forsikring, diverse
      ['Strøm, forsikring, diverse', '7 694', '', '', '', '', '', ''],
      
      // Row 13: Netto leie pr. mnd. (før sk)
      ['Netto leie pr. mnd. (før sk)', '46 875', '', '', '', '', '', ''],
      
      // Row 14: Skatt (22%)
      ['Skatt (22%)', '10 313', '', '', '', '', '', ''],
      
      // Row 15: Netto leie etter skatt
      ['Netto leie etter skatt', '36 563', '', '', '', '', '', ''],
      
      // Row 16: Rentekostnad
      ['Rentekostnad', '31 051', '', '', '', '', '', ''],
      
      // Row 17: Fradrag renter (22%)
      ['Fradrag renter (22%)', '6 831', '', '', '', '', '', ''],
      
      // Row 18: Sum etter finanskost og sk
      ['Sum etter finanskost og sk', '12 342', '', '', '', '', '', ''],
      
      // Row 19: Netto pr. år
      ['Netto pr. år', '148 110', '', '', '', '', '', ''],
      
      // Row 20: Avkastning egenkapitalen
      ['Avkastning egenkapitalen', '7,71%', '', '', '', '', '', ''],
      
      // Row 21: Empty rows for natural ending
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '']
    ];
  }, [data]);

  // Loan calculation sheet data (Lån - Kalkyle 2025) - Demo version
  const getLanData = useCallback(() => {
    return [
      // Header
      ['Lånebeløp og betingelser', '', '', '', '', '', '', ''],
      
      // Loan details
      ['Lån', '6 000 000', '', '', '', '', '', ''],
      ['Nominell rente per år (PA)', '5.5', '', '', '', '', '', ''],
      ['Nedbetalingstid, antall år', '25', '', '', '', '', '', ''],
      ['Avdragsfrie år', '0', '', '', '', '', '', ''],
      ['Terminer per år', '12', '', '', '', '', '', ''],
      ['Termingebyr', '50', '', '', '', '', '', ''],
      ['Tinglysningsgebyr', '2 500', '', '', '', '', '', ''],
      ['Etableringsgebyr', '1 500', '', '', '', '', '', ''],
      ['Inkludere gebyrer i lånebeløp?', 'Ja', '', '', '', '', '', ''],
      
      // Empty row
      ['', '', '', '', '', '', '', ''],
      
      // Cost summary
      ['Avdrag, renter andre kostnader', '', '', '', '', '', '', ''],
      ['Lånebeløp inkl gebyrer', '6 004 000', '', '', '', '', '', ''],
      ['Avdrag og rente/termin', '36 750', '', '', '', '', '', ''],
      ['Nedbetalt i perioden', '11 025 000', '', '', '', '', '', ''],
      ['Renter', '5 021 000', '', '', '', '', '', ''],
      ['Etablering og tinglysning', '4 000', '', '', '', '', '', ''],
      ['Sum kostnader', '5 025 000', '', '', '', '', '', ''],
      ['Total kostnad i % av lånesum', '83.8', '', '', '', '', '', ''],
      ['Termingebyr utgjør', '15 000', '', '', '', '', '', ''],
      
      // Empty row
      ['', '', '', '', '', '', '', ''],
      
      // Amortization table header
      ['', '', '', 'Termin', 'Terminbeløp', 'Renter', 'Avdrag', 'Restgjeld'],
      
      // Initial debt
      ['', '', '', '0', '', '', '', '6 004 000'],
      
      // First few installments
      ['', '', '', '1', '36 750', '27 518', '9 232', '5 994 768'],
      ['', '', '', '2', '36 750', '27 475', '9 275', '5 985 493'],
      ['', '', '', '3', '36 750', '27 432', '9 318', '5 976 175'],
      ['', '', '', '4', '36 750', '27 389', '9 361', '5 966 814'],
      ['', '', '', '5', '36 750', '27 345', '9 405', '5 957 409'],
      
      // Annual summary header
      ['', '', '', '', '', '', '', ''],
      ['', '', '', 'Periode', 'Renter pr. Å', 'Avdrag pr. Å', '', ''],
      ['', '', '', 'År 1', '328 500', '112 500', '', ''],
      ['', '', '', 'År 2', '320 250', '120 750', '', ''],
      ['', '', '', 'År 3', '311 625', '129 375', '', ''],
      ['', '', '', 'År 4', '302 625', '138 375', '', ''],
      ['', '', '', 'År 5', '293 250', '147 750', '', '']
    ];
  }, []);

  // Total overview sheet data - Demo version
  const getOversiktData = useCallback(() => {
    return [
      // Header
      ['', '', 'Eiendomsinvesteringer for Leily AS', '', '', '', '', '', '', '', '', '', '', ''],
      
      // Property columns
      ['', '', 'Hafrsfjordgata 49', '', 'Adresse 2', '', 'Adresse 3', '', 'Adresse 4', '', 'Adresse 5', '', 'Total sum', ''],
      
      // Empty row
      ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      
      // Investment details
      ['', '', 'Verdi', '7 500 000', '', '', '', '', '', '', '', '', '7 500 000', ''],
      ['', '', 'Lån', '6 000 000', '', '', '', '', '', '', '', '', '6 000 000', ''],
      ['', '', 'Rente', '5.5', '', '', '', '', '', '', '', '', '5.5', ''],
      ['', '', 'Lånebelastning pr. enhet', '80%', '', '', '', '', '', '', '', '', '80%', ''],
      ['', '', 'EK', '1 500 000', '', '', '', '', '', '', '', '', '1 500 000', ''],
      ['', '', 'Lånebelastning totalt', '', '', '', '', '', '', '', '', '', '80%', ''],
      
      // Empty row
      ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      
      // Expenses section
      ['', '', 'UTGIFTER: pr. år', '', '', '', '', '', '', '', '', '', '', ''],
      ['', '', 'Renteutgifter', '330 000', '', '', '', '', '', '', '', '', '330 000', ''],
      ['', '', 'Felles utgifter', '30 000', '', '', '', '', '', '', '', '', '30 000', ''],
      ['', '', 'Kommunale avgifter', '21 600', '', '', '', '', '', '', '', '', '21 600', ''],
      ['', '', 'Forsikring', '8 000', '', '', '', '', '', '', '', '', '8 000', ''],
      ['', '', 'Strøm', '36 000', '', '', '', '', '', '', '', '', '36 000', ''],
      ['', '', 'Avdrag *', '135 000', '', '', '', '', '', '', '', '', '135 000', ''],
      ['', '', 'Utgifter pr. enhet:', '560 600', '', '', '', '', '', '', '', '', '560 600', ''],
      
      // Empty row
      ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      
      // Income section
      ['', '', 'INNTEKTER: pr. år', '', '', '', '', '', '', '', '', '', '', ''],
      ['', '', 'Leieinntekt', '540 000', '', '', '', '', '', '', '', '', '540 000', ''],
      ['', '', 'Diverse inntekt', '0', '', '', '', '', '', '', '', '', '0', ''],
      ['', '', 'Inntekter pr. enhet', '540 000', '', '', '', '', '', '', '', '', '540 000', ''],
      
      // Empty row
      ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      
      // Results section
      ['', '', 'RESULTAT: før skatt', '-20 600', '', '', '', '', '', '', '', '', '-20 600', ''],
      ['', '', 'Skatt 22%', '0', '', '', '', '', '', '', '', '', '0', ''],
      ['', '', 'RESULTAT: etter skatt', '-20 600', '', '', '', '', '', '', '', '', '-20 600', ''],
      ['', '', 'Rentefradrag', '72 600', '', '', '', '', '', '', '', '', '72 600', ''],
      ['', '', 'Resultat e/ rentefradrag', '52 000', '', '', '', '', '', '', '', '', '52 000', ''],
      ['', '', 'Pr. Mnd.', '4 333', '', '', '', '', '', '', '', '', '4 333', '']
    ];
  }, []);

  // Risk assessment sheet data - Demo version
  const getRisikoData = useCallback(() => {
    return [
      // Header
      ['', 'RISIKOVURDERING OG PACE-PLAN', '', '', '', '', '', '', '', ''],
      
      // Empty row
      ['', '', '', '', '', '', '', '', '', ''],
      
      // ROS section
      ['', 'RISIKO- OG SÅRBARHETSANALYSE (ROS)', '', '', '', '', '', '', '', ''],
      ['', 'Hendelse / risiko', 'Sannsynlighet (1-5)', 'Konsekvens (1-5)', 'Risikonivå', 'Kommentar / beskrivelse', 'Tiltak / reduksjon', '', '', ''],
      ['', 'Ledighet / tap av leietakere', '2', '3', '6', 'Kan føre til lavere kontantstrøm i perioder', 'Opprette bufferkonto, aktiv markedsføring', '', '', ''],
      ['', 'Renteøkning', '2', '4', '8', 'Rente stiger over 7%, høyere månedlige kostnader', 'Vurdere fastrente eller ekstra nedbetaling', '', '', ''],
      ['', 'Uforutsett vedlikehold', '4', '3', '12', 'Tak, rør eller bad krever akutt utbedring', 'Opprette vedlikeholdsfond', '', '', ''],
      ['', 'Endring i boligmarkedet', '2', '4', '8', 'Lavere verdi ved salg', 'Langsiktig investeringshorisont', '', '', ''],
      ['', 'Forsikringskostnader øker', '3', '2', '6', 'Prisjusteringer fra forsikringsselskap', 'Sammenligne forsikring årlig', '', '', ''],
      
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
      ['', 'Gjennomsnittlig risikonivå', '8', '', '', '', '', '', '', ''],
      ['', 'Kommentar til risikobilde', 'Samlet risiko vurderes som middels. Tiltak bør revideres årlig eller ved store markedsendringer.', '', '', '', '', '', '', '']
    ];
  }, []);

  // Get data based on active tab
  const getCurrentData = useCallback(() => {
    switch (activeTab) {
      case 'eiendom':
        return getEiendomData();
      case 'kalkyle':
        return getKalkyleData();
      case 'lan':
        return getLanData();
      case 'oversikt':
        return getOversiktData();
      case 'risiko':
        return getRisikoData();
      default:
        return getEiendomData();
    }
  }, [activeTab, getEiendomData, getKalkyleData, getLanData, getOversiktData, getRisikoData]);

  // Define which cells are editable
  const getEditableCells = useCallback(() => {
    const editableCells: { [key: string]: boolean } = {};
    
    // Property sheet - editable cells
    if (activeTab === 'eiendom') {
      const propertyEditableCells = [
        '1,1', '2,1', // Address, postal code
        '3,1', '4,1', '5,1', // Property type, size, year built
        '1,3', '2,3', '3,3', '4,3', // Loan amount, interest rate, term, interest-free years
        '1,5', '2,5', '3,5', '4,5', // Purchase price, equity, loan-to-value, monthly rent
        '8,1', '9,1', '10,1', '11,1', '12,1', // Key property info (value, per m², yield, condition, energy)
        '15,1', '16,1', '17,1' // Buyer name, email, phone
      ];
      
      propertyEditableCells.forEach(cellKey => {
        editableCells[cellKey] = true;
      });
    }
    
    // Kalkyle sheet - editable cells
    if (activeTab === 'kalkyle') {
      const kalkyleEditableCells = [
        '1,1', '2,1', '3,1', // Totalpris, Rente, Lån
        '6,1', '7,1', '8,1', '11,1', // Leieinntekt, Felleskost, Kom.avg, Diverse
        '1,4', '2,4', '3,4', '4,4', '5,4', '6,4', '7,4', '8,4', // Cashflow inputs
        '1,6', '4,6' // Nettoyield inputs (Leieinntekter, Kjøpesum)
      ];
      
      kalkyleEditableCells.forEach(cellKey => {
        editableCells[cellKey] = true;
      });
    }
    
    return editableCells;
  }, [activeTab]);

  // Define cell styling
  const getCellStyling = useCallback(() => {
    const cellStyle: { [key: string]: any } = {};
    
    // Property sheet styling
    if (activeTab === 'eiendom') {
      // Property sheet headers
      cellStyle['0,0'] = { className: 'section-header' };
      cellStyle['0,2'] = { className: 'section-header' };
      cellStyle['0,4'] = { className: 'section-header' };
      cellStyle['7,0'] = { className: 'section-header' };
      cellStyle['14,0'] = { className: 'section-header' };
      
      // Property sheet labels
      const propertyLabelRows = [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 15, 16, 17];
      propertyLabelRows.forEach(row => {
        cellStyle[`${row},0`] = { className: 'label-cell' };
      });
      
      // Loan info labels
      const loanLabelRows = [1, 2, 3, 4];
      loanLabelRows.forEach(row => {
        cellStyle[`${row},2`] = { className: 'label-cell' };
      });
      
      // Investment info labels
      const investmentLabelRows = [1, 2, 3, 4];
      investmentLabelRows.forEach(row => {
        cellStyle[`${row},4`] = { className: 'label-cell' };
      });
      
      // Property sheet calculated cells
      const propertyCalculatedCells = [
        '1,1', '2,1', '3,1', '4,1', '5,1', '6,1', // Property info values
        '1,3', '2,3', '3,3', '4,3', // Loan info values
        '1,5', '2,5', '3,5', '4,5', // Investment info values
        '8,1', '9,1', '10,1', '11,1', '12,1', // Key property info values
        '15,1', '16,1', '17,1' // Contact info values
      ];
      
      propertyCalculatedCells.forEach(cellKey => {
        cellStyle[cellKey] = { className: 'calculated-cell' };
      });
    }
    
    // Kalkyle sheet styling
    if (activeTab === 'kalkyle') {
      // Section headers (row 1)
      cellStyle['0,0'] = { className: 'section-header' };
      cellStyle['0,3'] = { className: 'section-header' };
      cellStyle['0,5'] = { className: 'section-header' };
      
      // Highlight important values with special border
      cellStyle['1,1'] = { className: 'highlighted-value' }; // Totalpris eiendom
      cellStyle['2,1'] = { className: 'highlighted-value' }; // Rente
      cellStyle['3,1'] = { className: 'highlighted-value' }; // Lån
    }
    
    // Labels (column 0) - all rows with labels for Kalkyle sheet
    if (activeTab === 'kalkyle') {
      const labelRows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
      labelRows.forEach(row => {
        cellStyle[`${row},0`] = { className: 'label-cell' };
      });
    }
    
    // Cashflow labels (column 3) for Kalkyle sheet
    if (activeTab === 'kalkyle') {
      const cashflowLabelRows = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      cashflowLabelRows.forEach(row => {
        cellStyle[`${row},3`] = { className: 'label-cell' };
      });
    }
    
    // Nettoyield labels (column 5) for Kalkyle sheet
    if (activeTab === 'kalkyle') {
      const nettoyieldLabelRows = [1, 2, 3, 4, 5];
      nettoyieldLabelRows.forEach(row => {
        cellStyle[`${row},5`] = { className: 'label-cell' };
      });
    }
    
    // Calculated cells (gray background) - Kalkyle sheet
    // Only apply calculated cells styling for Kalkyle sheet
    if (activeTab === 'kalkyle') {
      const calculatedCells = [
        '4,1', // Egenkapital
        '5,1', // Lånebelastning kjøpesum
        '6,1', // Leieinntekt per mnd
        '8,1', // Kommunale avgifter pr. m
        '9,1', // Ledighet (3%)
        '10,1', // Vedlikehold (5%)
        '11,1', // Strøm, forsikring, diverse
        '12,1', // Netto leie pr. mnd. (før sk)
        '13,1', // Skatt (22%)
        '14,1', // Netto leie etter skatt
        '15,1', // Rentekostnad
        '16,1', // Fradrag renter (22%)
        '17,1', // Sum etter finanskost og sk
        '18,1', // Netto pr. år
        '19,1', // Avkastning egenkapitalen
        '1,4', '2,4', '3,4', '4,4', '5,4', '6,4', '7,4', '8,4', '9,4', // Cashflow calculated values
        '1,6', '2,6', '3,6', '4,6', '5,6' // Nettoyield calculated values
      ];
      
      calculatedCells.forEach(cellKey => {
        cellStyle[cellKey] = { className: 'calculated-cell' };
      });
    }
    
    // Loan sheet styling
    if (activeTab === 'lan') {
      // Loan sheet headers
      cellStyle['0,1'] = { className: 'main-header' };
      cellStyle['10,1'] = { className: 'section-header' };
      cellStyle['17,5'] = { className: 'table-header' };
      cellStyle['17,6'] = { className: 'table-header' };
      cellStyle['17,7'] = { className: 'table-header' };
      cellStyle['17,8'] = { className: 'table-header' };
      cellStyle['17,9'] = { className: 'table-header' };
      cellStyle['20,5'] = { className: 'table-header' };
      cellStyle['20,6'] = { className: 'table-header' };
      cellStyle['20,7'] = { className: 'table-header' };
      cellStyle['20,8'] = { className: 'table-header' };
      
      // Loan sheet calculated cells
      const loanCalculatedCells = [
        '11,2', '12,2', '13,2', '14,2', '15,2', '16,2', '17,2', '18,2', // Loan calculations
        '18,6', '18,7', '18,8', '18,9', // Amortization table values
        '19,6', '19,7', '19,8', '19,9', // First installment
        '20,6', '20,7', '20,8', '20,9', // Second installment
        '21,6', '21,7', '21,8', '21,9', // Third installment
        '22,6', '22,7', '22,8', '22,9', // Fourth installment
        '23,6', '23,7', '23,8', '23,9', // Fifth installment
        '25,6', '25,7', '25,8', // Annual summary values
        '26,6', '26,7', '26,8', // Year 1
        '27,6', '27,7', '27,8', // Year 2
        '28,6', '28,7', '28,8', // Year 3
        '29,6', '29,7', '29,8', // Year 4
        '30,6', '30,7', '30,8'  // Year 5
      ];
      
      loanCalculatedCells.forEach(cellKey => {
        cellStyle[cellKey] = { className: 'calculated-cell' };
      });
    }
    
    // Overview sheet styling
    if (activeTab === 'oversikt') {
      // Overview sheet headers
      cellStyle['0,2'] = { className: 'main-header' };
      cellStyle['1,2'] = { className: 'table-header' };
      cellStyle['1,4'] = { className: 'table-header' };
      cellStyle['1,6'] = { className: 'table-header' };
      cellStyle['1,8'] = { className: 'table-header' };
      cellStyle['1,10'] = { className: 'table-header' };
      cellStyle['1,12'] = { className: 'table-header' };
      cellStyle['7,2'] = { className: 'section-header' };
      cellStyle['15,2'] = { className: 'section-header' };
      cellStyle['19,2'] = { className: 'section-header' };
      
      // Overview sheet calculated cells
      const overviewCalculatedCells = [
        '3,3', '3,13', // Verdi
        '4,3', '4,13', // Lån
        '5,3', '5,13', // Rente
        '6,3', '6,13', // Lånebelastning pr. enhet
        '7,3', '7,13', // EK
        '8,13', // Lånebelastning totalt
        '9,3', '9,13', // Renteutgifter
        '10,3', '10,13', // Felles utgifter
        '11,3', '11,13', // Kommunale avgifter
        '12,3', '12,13', // Forsikring
        '13,3', '13,13', // Strøm
        '14,3', '14,13', // Avdrag
        '15,3', '15,13', // Utgifter pr. enhet
        '17,3', '17,13', // Leieinntekt
        '18,3', '18,13', // Diverse inntekt
        '19,3', '19,13', // Inntekter pr. enhet
        '21,3', '21,13', // RESULTAT: før skatt
        '22,3', '22,13', // Skatt 22%
        '23,3', '23,13', // RESULTAT: etter skatt
        '24,3', '24,13', // Rentefradrag
        '25,3', '25,13', // Resultat e/ rentefradrag
        '26,3', '26,13'  // Pr. Mnd.
      ];
      
      overviewCalculatedCells.forEach(cellKey => {
        cellStyle[cellKey] = { className: 'calculated-cell' };
      });
    }
    
    // Risk sheet styling
    if (activeTab === 'risiko') {
      // Risk sheet headers
      cellStyle['0,1'] = { className: 'main-header' };
      cellStyle['2,1'] = { className: 'section-header' };
      cellStyle['3,1'] = { className: 'table-header' };
      cellStyle['3,2'] = { className: 'table-header' };
      cellStyle['3,3'] = { className: 'table-header' };
      cellStyle['3,4'] = { className: 'table-header' };
      cellStyle['3,5'] = { className: 'table-header' };
      cellStyle['3,6'] = { className: 'table-header' };
      cellStyle['10,1'] = { className: 'section-header' };
      cellStyle['11,1'] = { className: 'table-header' };
      cellStyle['11,2'] = { className: 'table-header' };
      cellStyle['11,3'] = { className: 'table-header' };
      cellStyle['11,4'] = { className: 'table-header' };
      cellStyle['11,5'] = { className: 'table-header' };
      cellStyle['11,6'] = { className: 'table-header' };
      cellStyle['18,1'] = { className: 'section-header' };
      
      // Risk sheet calculated cells
      const riskCalculatedCells = [
        '4,2', '4,3', '4,4', // Risk assessment values
        '5,2', '5,3', '5,4', // Risk assessment values
        '6,2', '6,3', '6,4', // Risk assessment values
        '7,2', '7,3', '7,4', // Risk assessment values
        '8,2', '8,3', '8,4', // Risk assessment values
        '9,2', '9,3', '9,4', // Risk assessment values
        '19,2' // Gjennomsnittlig risikonivå
      ];
      
      riskCalculatedCells.forEach(cellKey => {
        cellStyle[cellKey] = { className: 'calculated-cell' };
      });
    }
    
    return cellStyle;
  }, [activeTab]);

  // Handle cell changes
  const handleAfterChange = useCallback((changes: any) => {
    if (!changes || !onDataChange) return;
    
    changes.forEach((change: any) => {
      const [row, col, oldValue, newValue] = change;
      
      // Map changes to property data - Context-aware field mapping
      const getFieldMap = (activeTab: string) => {
        if (activeTab === 'eiendom') {
          return {
            '1,1': 'address',
            '2,1': 'postalCode',
            '3,1': 'propertyType',
            '4,1': 'size',
            '5,1': 'yearBuilt',
            '1,3': 'loanAmount',
            '2,3': 'interestRate',
            '3,3': 'loanTerm',
            '4,3': 'interestOnlyYears',
            '1,5': 'purchasePrice',
            '2,5': 'equity',
            '3,5': 'loanToValue',
            '4,5': 'monthlyRent',
            '8,1': 'propertyValue',
            '9,1': 'valuePerM2',
            '10,1': 'rentalYield',
            '11,1': 'propertyCondition',
            '12,1': 'energyRating',
            '15,1': 'buyerName',
            '16,1': 'buyerEmail',
            '17,1': 'buyerPhone'
          };
        } else if (activeTab === 'kalkyle') {
          return {
            '1,1': 'totalPrice',
            '2,1': 'interestRate',
            '3,1': 'loanAmount',
            '6,1': 'monthlyRent',
            '7,1': 'commonCosts',
            '8,1': 'municipalFees',
            '11,1': 'otherExpenses',
            '1,4': 'rentalIncome',
            '2,4': 'cashflow_commonCosts',
            '3,4': 'cashflow_municipalFees',
            '4,4': 'maintenance',
            '5,4': 'cashflow_otherExpenses',
            '6,4': 'tax',
            '7,4': 'vacancy',
            '8,4': 'interestAndPrincipal',
            '1,6': 'annualRentalIncome',
            '4,6': 'netto_purchasePrice'
          };
        }
        return {};
      };
      
      const fieldMap = getFieldMap(activeTab);
      
      const fieldKey = `${row},${col}`;
      const fieldName = fieldMap[fieldKey];
      
      if (fieldName) {
        onDataChange(fieldName, newValue);
      }
    });
  }, [onDataChange]);


  // Export as Excel with all sheets
  const handleExportExcel = useCallback(() => {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Get all sheet data
      const eiendomData = getEiendomData();
      const kalkyleData = getKalkyleData();
      const lanData = getLanData();
      const oversiktData = getOversiktData();
      const risikoData = getRisikoData();
      
      // Convert data to worksheets (values only, no formulas)
      const eiendomWS = XLSX.utils.aoa_to_sheet(eiendomData);
      const kalkyleWS = XLSX.utils.aoa_to_sheet(kalkyleData);
      const lanWS = XLSX.utils.aoa_to_sheet(lanData);
      const oversiktWS = XLSX.utils.aoa_to_sheet(oversiktData);
      const risikoWS = XLSX.utils.aoa_to_sheet(risikoData);
      
      // Set column widths for better formatting
      const columnWidths = [
        { wch: 25 }, // Column A
        { wch: 15 }, // Column B
        { wch: 5 },  // Column C
        { wch: 15 }, // Column D
        { wch: 5 },  // Column E
        { wch: 15 }, // Column F
        { wch: 5 },  // Column G
        { wch: 15 }  // Column H
      ];
      
      [eiendomWS, kalkyleWS, lanWS, oversiktWS, risikoWS].forEach(ws => {
        ws['!cols'] = columnWidths;
      });
      
      // Add worksheets to workbook
      XLSX.utils.book_append_sheet(workbook, eiendomWS, 'Eiendom');
      XLSX.utils.book_append_sheet(workbook, kalkyleWS, 'Kalkyle');
      XLSX.utils.book_append_sheet(workbook, lanWS, 'Lån');
      XLSX.utils.book_append_sheet(workbook, oversiktWS, 'Oversikt');
      XLSX.utils.book_append_sheet(workbook, risikoWS, 'Risiko');
      
      // Generate filename with current date
      const today = new Date().toISOString().split('T')[0];
      const filename = `Boligkalkyle-${today}.xlsx`;
      
      // Write and download file
      XLSX.writeFile(workbook, filename);
      
    } catch (error) {
      console.error('Error exporting Excel:', error);
    }
  }, [getEiendomData, getKalkyleData, getLanData, getOversiktData, getRisikoData]);

  // Handsontable configuration
  const hotSettings = {
    data: getCurrentData(),
    colHeaders: false,
    rowHeaders: false,
    width: '100%',
    height: 700,
    licenseKey: 'non-commercial-and-evaluation',
    colWidths: [180, 140, 40, 140, 40, 140, 40, 140], // Balanced column widths for symmetry
    cells: (row: number, col: number) => {
      const editableCells = getEditableCells();
      const cellStyle = getCellStyling();
      const cellKey = `${row},${col}`;
      
      // Determine cell type and formatting
      let cellType = 'text';
      let format = null;
      
      // Numeric cells - check if it's a number string
      if (col > 2 && row > 0) {
        const data = getCurrentData();
        const cellValue = data[row]?.[col];
        
        if (typeof cellValue === 'string' && cellValue.trim() !== '') {
          // Clean the value for numeric check: remove spaces, thousands separators, and percentage signs
          const cleanedForParse = cellValue.replace(/[\s%]/g, '').replace(/\./g, '').replace(',', '.');
          
          const parsedValue = parseFloat(cleanedForParse);
          
          if (!isNaN(parsedValue)) {
            cellType = 'numeric';
            
            // Determine format based on original cellValue content
            if (cellValue.includes('%')) {
              format = '0.0%'; // For percentages like '4.1%' or '80%'
            } else if (cellValue.includes(',')) {
              // If it contains a comma, assume it's a decimal separator
              if (cellValue.split(',')[1]?.length > 0) {
                format = '0,0.00'; // Example: 1.234,56
              } else {
                format = '0,0'; // Example: 1.234
              }
            } else if (cellValue.includes('.')) {
              // If it contains a period, assume it's a decimal separator
              if (cellValue.split('.')[1]?.length > 0) {
                format = '0.00'; // Example: 1234.56
              } else {
                format = '0'; // Example: 1234
              }
            } else {
              format = '0,0'; // Default for integers with thousands separator
            }
          }
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
    { key: 'eiendom', label: 'Eiendom', icon: Home },
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
          <Button onClick={handleExportExcel} size="sm" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Last ned Excel
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
          <div className="border rounded-xl overflow-hidden shadow-sm" style={{ borderColor: colors.border }}>
            <div className="overflow-auto">
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
              padding: 6px 10px;
              font-size: 12px;
              transition: all 0.2s ease;
              max-width: 200px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              height: 28px;
              line-height: 16px;
            }
        
        .handsontable td:hover {
          background-color: ${colors.background};
        }
        
            .handsontable .htCore td.main-header {
              background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
              color: white;
              font-weight: 600;
              text-align: center;
              font-size: 13px;
              letter-spacing: 0.2px;
              white-space: normal;
              height: 28px;
              line-height: 16px;
            }
            
            .handsontable .htCore td.section-header {
              background: linear-gradient(135deg, ${colors.secondary}, ${colors.accent});
              color: white;
              font-weight: 600;
              font-size: 12px;
              letter-spacing: 0.1px;
              white-space: normal;
              height: 28px;
              line-height: 16px;
            }
            
            .handsontable .htCore td.table-header {
              background: ${colors.primary};
              color: white;
              font-weight: 600;
              text-align: center;
              font-size: 11px;
              height: 28px;
              line-height: 16px;
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
        
        .handsontable .htCore td.highlighted-value {
          background-color: ${colors.background};
          color: ${colors.text};
          font-weight: 600;
          border: 2px solid ${colors.primary} !important;
          box-shadow: 0 0 0 1px ${colors.primary};
        }
        
            .handsontable .htCore td[data-cell-type="numeric"] {
              text-align: right !important;
            }
            
            .handsontable .htCore td[data-cell-type="text"] {
              text-align: left !important;
            }
            
            /* Force right alignment for all numeric values */
            .handsontable .htCore td.calculated-cell {
              text-align: right !important;
            }
            
            /* Ensure all value columns are right-aligned across all sheets */
            .handsontable .htCore td:nth-child(3),
            .handsontable .htCore td:nth-child(4),
            .handsontable .htCore td:nth-child(5),
            .handsontable .htCore td:nth-child(6),
            .handsontable .htCore td:nth-child(7),
            .handsontable .htCore td:nth-child(8),
            .handsontable .htCore td:nth-child(9),
            .handsontable .htCore td:nth-child(10),
            .handsontable .htCore td:nth-child(11),
            .handsontable .htCore td:nth-child(12),
            .handsontable .htCore td:nth-child(13),
            .handsontable .htCore td:nth-child(14) {
              text-align: right !important;
            }
        
            .handsontable .htCore {
              border-collapse: separate;
              border-spacing: 0;
              table-layout: fixed;
            }
            
            .handsontable .htCore tr {
              height: 28px;
            }
            
            .handsontable .htCore tr td {
              height: 28px !important;
              vertical-align: middle;
              min-height: 28px;
              max-height: 28px;
            }
            
            .handsontable .htCore tbody tr {
              height: 28px !important;
            }
            
            .handsontable .htCore thead tr {
              height: 28px !important;
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