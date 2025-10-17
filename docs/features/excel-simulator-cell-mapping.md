# Excel Simulator Cell Mapping

## Overview
This document maps all cells in the Excel simulator to their corresponding data fields and provides a foundation for chat-agent integration.

## Cell Mapping Structure

### Eiendom Sheet (Property Information)

#### Row 1: Section Headers
- `0,0`: "Eiendomsinformasjon" (section header)
- `0,2`: "Låneinformasjon" (section header)  
- `0,4`: "Investeringsinformasjon" (section header)

#### Row 2-6: Property Information (Column 0-1)
- `1,0`: "Adresse" (label) → `1,1`: Address value (editable)
- `2,0`: "Postnummer og sted" (label) → `2,1`: Postal code value (editable)
- `3,0`: "Eiendomstype" (label) → `3,1`: Property type (editable)
- `4,0`: "Størrelse" (label) → `4,1`: Size (editable)
- `5,0`: "Byggeår" (label) → `5,1`: Year built (editable)

#### Row 2-5: Loan Information (Column 2-3)
- `1,2`: "Lånebeløp" (label) → `1,3`: Loan amount (editable)
- `2,2`: "Rente" (label) → `2,3`: Interest rate (editable)
- `3,2`: "Løpetid" (label) → `3,3`: Loan term (editable)
- `4,2`: "Avdragsfrie år" (label) → `4,3`: Interest-free years (editable)

#### Row 2-5: Investment Information (Column 4-5)
- `1,4`: "Kjøpesum" (label) → `1,5`: Purchase price (editable)
- `2,4`: "Egenkapital" (label) → `2,5`: Equity (editable)
- `3,4`: "Lånebelastning" (label) → `3,5`: Loan-to-value ratio (editable)
- `4,4`: "Månedlig leie" (label) → `4,5`: Monthly rent (editable)

#### Row 8-12: Key Property Information
- `7,0`: "Nøkkelinformasjon om eiendommen" (section header)
- `8,0`: "Verditakst" (label) → `8,1`: Property value (editable)
- `9,0`: "Verdi per m²" (label) → `9,1`: Value per m² (editable)
- `10,0`: "Leieavkastning" (label) → `10,1`: Rental yield (editable)
- `11,0`: "Tilstand" (label) → `11,1`: Property condition (editable)
- `12,0`: "Energimerking" (label) → `12,1`: Energy rating (editable)

#### Row 15-17: Contact Information
- `14,0`: "Kontaktinformasjon" (section header)
- `15,0`: "Kjøper" (label) → `15,1`: Buyer name (editable)
- `16,0`: "E-post" (label) → `16,1`: Email (editable)
- `17,0`: "Telefon" (label) → `17,1`: Phone (editable)

### Kalkyle Sheet (Main Calculation)

#### Row 1: Section Headers
- `0,0`: "Avkastning ved boligkjøp" (section header)
- `0,3`: "Pengestrøm" (section header)
- `0,5`: "Nettoavkastning" (section header)

#### Row 2-20: Calculation Data
- `1,0`: "Totalpris eiendom" (label) → `1,1`: Total price (editable, highlighted)
- `2,0`: "Rente" (label) → `2,1`: Interest rate (editable, highlighted)
- `3,0`: "Lån" (label) → `3,1`: Loan amount (editable, highlighted)
- `4,0`: "Egenkapital" (label) → `4,1`: Equity (calculated)
- `5,0`: "Lånebelastning kjøpesum" (label) → `5,1`: Loan-to-value (calculated)
- `6,0`: "Leieinntekt per mnd" (label) → `6,1`: Monthly rent (editable)
- `7,0`: "Felleskostnader pr. mnd" (label) → `7,1`: Common costs (editable)
- `8,0`: "Kommunale avgifter pr. m" (label) → `8,1`: Municipal fees (editable)
- `9,0`: "Ledighet (3%)" (label) → `9,1`: Vacancy rate (calculated)
- `10,0`: "Vedlikehold (5%)" (label) → `10,1`: Maintenance (calculated)
- `11,0`: "Strøm, forsikring, diverse" (label) → `11,1`: Other expenses (editable)
- `12,0`: "Netto leie pr. mnd. (før sk)" (label) → `12,1`: Net rent before tax (calculated)
- `13,0`: "Skatt (22%)" (label) → `13,1`: Tax (calculated)
- `14,0`: "Netto leie etter skatt" (label) → `14,1`: Net rent after tax (calculated)
- `15,0`: "Rentekostnad" (label) → `15,1`: Interest cost (calculated)
- `16,0`: "Fradrag renter (22%)" (label) → `16,1`: Interest deduction (calculated)
- `17,0`: "Sum etter finanskost og sk" (label) → `17,1`: Sum after finance and tax (calculated)
- `18,0`: "Netto pr. år" (label) → `18,1`: Net per year (calculated)
- `19,0`: "Avkastning egenkapitalen" (label) → `19,1`: Return on equity (calculated)

#### Cashflow Section (Column 3-4)
- `1,3`: "Leieinntekt" (label) → `1,4`: Rental income (editable)
- `2,3`: "Felleskost" (label) → `2,4`: Common costs (editable)
- `3,3`: "Kom. Avg" (label) → `3,4`: Municipal fees (editable)
- `4,3`: "Vedlikehold (5%)" (label) → `4,4`: Maintenance (editable)
- `5,3`: "Diverse" (label) → `5,4`: Other expenses (editable)
- `6,3`: "Skatt *" (label) → `6,4`: Tax (editable)
- `7,3`: "Ledighet (3%)" (label) → `7,4`: Vacancy (editable)
- `8,3`: "Renter og avdrag" (label) → `8,4`: Interest and principal (editable)
- `9,3`: "Cashflow per mnd" (label) → `9,4`: Monthly cashflow (calculated)

#### Nettoavkastning Section (Column 5-6)
- `1,5`: "Leieinntekter" (label) → `1,6`: Annual rental income (editable)
- `2,5`: "Driftskostnader" (label) → `2,6`: Operating costs (editable)
- `3,5`: "Netto leieinntekt" (label) → `3,6`: Net rental income (calculated)
- `4,5`: "Kjøpesum" (label) → `4,6`: Purchase price (editable)
- `5,5`: "Netto yield" (label) → `5,6`: Net yield (calculated)

## Data Field Mapping

### Current Field Map (from handleAfterChange)
```typescript
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
```

### Proposed Complete Field Map
```typescript
const completeFieldMap: { [key: string]: string } = {
  // Eiendom sheet
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
  '17,1': 'buyerPhone',
  
  // Kalkyle sheet
  '1,1': 'totalPrice',
  '2,1': 'interestRate',
  '3,1': 'loanAmount',
  '6,1': 'monthlyRent',
  '7,1': 'commonCosts',
  '8,1': 'municipalFees',
  '11,1': 'otherExpenses',
  '1,4': 'rentalIncome',
  '2,4': 'commonCosts',
  '3,4': 'municipalFees',
  '4,4': 'maintenance',
  '5,4': 'otherExpenses',
  '6,4': 'tax',
  '7,4': 'vacancy',
  '8,4': 'interestAndPrincipal',
  '1,6': 'annualRentalIncome',
  '4,6': 'purchasePrice'
};
```

## Chat Agent Integration

### Natural Language to Cell Mapping
The chat agent should be able to understand natural language requests and map them to specific cells:

#### Examples:
- "Endre ledigheten fra 3% til 5%" → `7,4` (vacancy rate)
- "Sett renten til 6%" → `2,1` (interest rate) or `2,3` (loan interest rate)
- "Endre kjøpesum til 8 millioner" → `1,1` (total price) or `1,5` (purchase price)
- "Oppdater månedlig leie til 50 000" → `6,1` (monthly rent) or `4,5` (monthly rent)
- "Sett egenkapital til 2 millioner" → `2,5` (equity)

### Validation Rules
- Numeric values should be validated for reasonable ranges
- Percentages should be between 0-100%
- Currency values should be positive numbers
- Dates should be valid formats

### Security Considerations
- All changes should be validated before applying
- No direct database access from chat agent
- Changes should go through the existing onDataChange callback
- Input sanitization for all user inputs
- Rate limiting for chat agent requests
