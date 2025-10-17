import React, { useRef, useEffect, useState, useCallback } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet } from 'lucide-react';
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
  const [hyperformulaInstance, setHyperformulaInstance] = useState<HyperFormula | null>(null);

  // Initialize HyperFormula
  useEffect(() => {
    const hf = HyperFormula.buildEmpty({
      licenseKey: 'gpl-v3',
      useArrayArithmetic: true,
      useColumnIndex: true,
    });
    setHyperformulaInstance(hf);
  }, []);

  // Define the spreadsheet structure based on "Kalkyle - 2021" Excel sheet
  const getInitialData = useCallback(() => {
    return [
      // Row 0: Main header
      ['Boligkalkyle - 2021', '', '', '', '', '', ''],
      
      // Row 1: Empty
      ['', '', '', '', '', '', ''],
      
      // Row 2: Address and postal code
      ['Adresse og postnummer', data.address || '', '', '', '', '', ''],
      
      // Row 3: Empty
      ['', '', '', '', '', '', ''],
      
      // Row 4: Main property table header
      ['', 'Verditakst', 'Lånesum', 'Lånebelastning', 'Avdragsfrie år', '', ''],
      
      // Row 5: Main property values
      ['', data.totalPrice || '', data.loanAmount || '', '=C6/B6', data.interestOnlyYears || '0', '', ''],
      
      // Row 6: Empty
      ['', '', '', '', '', '', ''],
      
      // Row 7: Section header - Avkastning ved boligkjøp
      ['Avkastning ved boligkjøp', '', '', '', '', '', ''],
      
      // Row 8: Empty
      ['', '', '', '', '', '', ''],
      
      // Row 9-20: Avkastning section
      ['Rente (%)', data.interestRate || '4.5', '', '', '', '', ''],
      ['Lån (kr)', '=C6', '', '', '', '', ''],
      ['Egenkapital', '=B6-C6', '', '', '', '', ''],
      ['Lånebelastning kjøpesum', '=C6/B6', '', '', '', '', ''],
      ['Leieinntekt per mnd', data.monthlyRent || '', '', '', '', '', ''],
      ['Felleskostnader pr mnd', data.commonCosts || '', '', '', '', '', ''],
      ['Kommunale avgifter', data.municipalFees || '', '', '', '', '', ''],
      ['Ledighet (3 %)', '=B15*0.03', '', '', '', '', ''],
      ['Vedlikehold (5 %)', '=B15*0.05', '', '', '', '', ''],
      ['Strøm, forsikring, diverse', data.otherExpenses || '', '', '', '', '', ''],
      ['Netto leie (før skatt)', '=B15-B16-B17-B18-B19-B20', '', '', '', '', ''],
      ['Skatt (22 %)', '=B21*0.22', '', '', '', '', ''],
      ['Sum etter finans og skatt', '=B21-B22', '', '', '', '', ''],
      ['Netto pr. år', '=B23*12', '', '', '', '', ''],
      ['Avkastning egenkapitalen (%)', '=B24/B13*100', '', '', '', '', ''],
      
      // Row 25: Empty
      ['', '', '', '', '', '', ''],
      
      // Row 26: Section header - Cashflow per mnd (right side)
      ['Cashflow per mnd', '', '', '', '', '', ''],
      
      // Row 27: Empty
      ['', '', '', '', '', '', ''],
      
      // Row 28-35: Cashflow section
      ['Leieinntekt', '=B15', '', '', '', '', ''],
      ['Felleskost', '=B16', '', '', '', '', ''],
      ['Kom. avg', '=B17', '', '', '', '', ''],
      ['Vedlikehold (5 %)', '=B19', '', '', '', '', ''],
      ['Diverse', '=B20', '', '', '', '', ''],
      ['Skatt', '=B22', '', '', '', '', ''],
      ['Ledighet (3 %)', '=B18', '', '', '', '', ''],
      ['Renter og avdrag', '=PMT(B10/100/12,25*12,-B11)', '', '', '', '', ''],
      ['Cashflow per mnd (sumfelt)', '=B28-B29-B30-B31-B32-B33-B34-B35', '', '', '', '', ''],
      
      // Row 36: Empty
      ['', '', '', '', '', '', ''],
      
      // Row 37: Section header - Nettoyield på eiendommen
      ['Nettoyield på eiendommen*', '', '', '', '', '', ''],
      
      // Row 38: Empty
      ['', '', '', '', '', '', ''],
      
      // Row 39-43: Nettoyield section
      ['Leieinntekter', '=B15*12', '', '', '', '', ''],
      ['Driftskostnader', '=(B16+B17+B18+B19+B20)*12', '', '', '', '', ''],
      ['Netto leieinntekt', '=B39-B40', '', '', '', '', ''],
      ['Kjøpesum', '=B6', '', '', '', '', ''],
      ['Netto yield (%)', '=B41/B42*100', '', '', '', '', ''],
    ];
  }, [data]);

  // Define which cells are editable (white cells in original Excel)
  const getEditableCells = useCallback(() => {
    const editableCells: { [key: string]: boolean } = {};
    
    // Make input cells editable based on Excel structure
    const editableCellsList = [
      '2,1', // Address
      '5,1', // Verditakst (totalPrice)
      '5,2', // Lånesum (loanAmount)
      '5,4', // Avdragsfrie år (interestOnlyYears)
      '9,1', // Rente (%)
      '14,1', // Leieinntekt per mnd
      '15,1', // Felleskostnader pr mnd
      '16,1', // Kommunale avgifter
      '19,1', // Strøm, forsikring, diverse
    ];
    
    editableCellsList.forEach(cellKey => {
      editableCells[cellKey] = true;
    });
    
    return editableCells;
  }, []);

  // Define cell styling to match Excel appearance
  const getCellStyling = useCallback(() => {
    const cellStyle: { [key: string]: any } = {};
    
    // Main header styling
    cellStyle['0,0'] = {
      className: 'main-header'
    };
    
    // Section headers
    const sectionRows = [7, 26, 37]; // Avkastning ved boligkjøp, Cashflow per mnd, Nettoyield
    sectionRows.forEach(row => {
      cellStyle[`${row},0`] = {
        className: 'section-header'
      };
    });
    
    // Table header row
    cellStyle['4,1'] = { className: 'table-header' };
    cellStyle['4,2'] = { className: 'table-header' };
    cellStyle['4,3'] = { className: 'table-header' };
    cellStyle['4,4'] = { className: 'table-header' };
    
    // Calculated cells (read-only, gray background)
    const calculatedCells = [
      '5,3', // Lånebelastning
      '10,1', // Lån (kr)
      '11,1', // Egenkapital
      '12,1', // Lånebelastning kjøpesum
      '17,1', // Ledighet (3 %)
      '18,1', // Vedlikehold (5 %)
      '20,1', // Netto leie (før skatt)
      '21,1', // Skatt (22 %)
      '22,1', // Sum etter finans og skatt
      '23,1', // Netto pr. år
      '24,1', // Avkastning egenkapitalen (%)
      '28,1', // Leieinntekt (cashflow)
      '29,1', // Felleskost (cashflow)
      '30,1', // Kom. avg (cashflow)
      '31,1', // Vedlikehold (cashflow)
      '32,1', // Diverse (cashflow)
      '33,1', // Skatt (cashflow)
      '34,1', // Ledighet (cashflow)
      '35,1', // Renter og avdrag
      '36,1', // Cashflow per mnd (sumfelt)
      '39,1', // Leieinntekter (nettoyield)
      '40,1', // Driftskostnader (nettoyield)
      '41,1', // Netto leieinntekt (nettoyield)
      '42,1', // Kjøpesum (nettoyield)
      '43,1', // Netto yield (%)
    ];
    
    calculatedCells.forEach(cellKey => {
      cellStyle[cellKey] = {
        className: 'calculated-cell'
      };
    });
    
    // Labels (column A)
    for (let row = 2; row <= 43; row++) {
      if (!cellStyle[`${row},0`]) {
        cellStyle[`${row},0`] = {
          className: 'label-cell'
        };
      }
    }
    
    return cellStyle;
  }, []);

  // Handle cell changes
  const handleAfterChange = useCallback((changes: any) => {
    if (!changes || !onDataChange) return;
    
    changes.forEach((change: any) => {
      const [row, col, oldValue, newValue] = change;
      // Map row/column to data field names
      const fieldMap: { [key: string]: string } = {
        '2,1': 'address',
        '5,1': 'totalPrice',
        '5,2': 'loanAmount',
        '5,4': 'interestOnlyYears',
        '9,1': 'interestRate',
        '14,1': 'monthlyRent',
        '15,1': 'commonCosts',
        '16,1': 'municipalFees',
        '19,1': 'otherExpenses'
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
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const link = document.createElement('a');
      link.download = `boligkalkyle-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error exporting PNG:', error);
    }
  }, [hotInstance]);

  // Handsontable configuration
  const hotSettings = {
    data: getInitialData(),
    colHeaders: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    rowHeaders: true,
    width: '100%',
    height: 600,
    licenseKey: 'non-commercial-and-evaluation',
    colWidths: [200, 120, 120, 120, 120, 100, 100], // Wider first column for labels
    formulas: {
      engine: hyperformulaInstance
    },
    cells: (row: number, col: number) => {
      const editableCells = getEditableCells();
      const cellStyle = getCellStyling();
      const cellKey = `${row},${col}`;
      
      // Determine cell type and formatting
      let cellType = 'text';
      let format = null;
      
      // Numeric cells (mostly column B with values)
      if (col === 1 && row > 0) {
        const data = getInitialData();
        const cellValue = data[row]?.[col];
        
        // Check if it's a formula or numeric value
        if (typeof cellValue === 'string' && cellValue.startsWith('=')) {
          cellType = 'numeric';
          format = '0,0'; // Number format with thousands separator
        } else if (!isNaN(Number(cellValue)) && cellValue !== '') {
          cellType = 'numeric';
          format = '0,0'; // Number format with thousands separator
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
    stretchH: 'all',
    wordWrap: false,
    preventOverflow: 'horizontal',
    columnSorting: false,
    filters: false,
    dropdownMenu: false,
    comments: false,
    fillHandle: false,
    undoRedo: true
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-card flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          <span className="font-semibold text-lg">Boligkalkyle Simulator</span>
        </div>
        <Button onClick={handleExportPNG} size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Last ned bilde
        </Button>
      </div>

      {/* Spreadsheet */}
      <div className="flex-1 p-4">
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <HotTable
            ref={hotTableRef}
            {...hotSettings}
          />
        </div>
      </div>

      {/* Custom styles */}
      <style>{`
        .custom-cell {
          border: 1px solid #d0d0d0 !important;
        }
        
        .handsontable {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 12px;
        }
        
        .handsontable th {
          background-color: #f8f9fa !important;
          font-weight: bold !important;
          border: 1px solid #d0d0d0 !important;
          text-align: center !important;
          font-size: 11px !important;
        }
        
        .handsontable td {
          border: 1px solid #d0d0d0 !important;
          padding: 4px 8px !important;
          vertical-align: middle !important;
        }
        
        .handsontable .htCore td.htDimmed {
          background-color: #f5f5f5 !important;
          color: #666666 !important;
          font-weight: bold !important;
        }
        
        .handsontable .htCore td[data-cell-type="numeric"] {
          text-align: right !important;
        }
        
        .handsontable .htCore td[data-cell-type="text"] {
          text-align: left !important;
        }
        
        /* Section headers */
        .handsontable .htCore td.section-header {
          background-color: #e0e0e0 !important;
          font-weight: bold !important;
          color: #000000 !important;
          font-size: 13px !important;
        }
        
        /* Main header */
        .handsontable .htCore td.main-header {
          background-color: #f0f0f0 !important;
          font-weight: bold !important;
          font-size: 16px !important;
          text-align: center !important;
        }
        
        /* Labels */
        .handsontable .htCore td.label-cell {
          font-weight: bold !important;
          background-color: #ffffff !important;
        }
        
        /* Calculated cells */
        .handsontable .htCore td.calculated-cell {
          background-color: #f5f5f5 !important;
          color: #666666 !important;
          font-weight: bold !important;
        }
        
        /* Table headers */
        .handsontable .htCore td.table-header {
          background-color: #e0e0e0 !important;
          font-weight: bold !important;
          text-align: center !important;
          font-size: 12px !important;
        }
      `}</style>
    </div>
  );
};

export default BoligkalkyleSimulator;
