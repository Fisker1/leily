# `useCalculatorData` (`src/hooks/useCalculatorData.tsx`)

Client state manager for calculator inputs, per-module activation tracking, and derived report data.

## Return value

```ts
{
  data: CalculatorData,
  updateField: (field: string, value: any, moduleId?: string) => void,
  isModuleActivated: (moduleId: string) => boolean,
  getModuleData: (moduleId: string) => any,
  getReportData: () => any
}
```

- Tracks which modules are activated and their inputs
- Computes report aggregates: payments, cash flow, yields, LTV, and per-module sections

## Example

```ts
const { data, updateField, getReportData, isModuleActivated } = useCalculatorData();

updateField('totalPrice', '3500000');
updateField('expectedAnnualRent', '240000', 'Markedsanalyse');

const report = getReportData();
```