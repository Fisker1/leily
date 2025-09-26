# `usePropertyData` (`src/hooks/usePropertyData.tsx`)

Fetches user properties and calculation history, with client-side geocoding via Nominatim and caching.

## Types

- `Property`: `{ id, address, city?, postal_code?, property_type?, monthly_rent?, current_value?, show_in_rental?, owner_id, coordinates? }`
- `CalculationProperty`: `{ id, property_address, finn_code, calculation_data, results_data, coordinates? }`

## Return value

```ts
{
  properties: Property[],
  calculationProperties: CalculationProperty[],
  loading: boolean,
  refetch: () => void
}
```

## Example

```ts
const { properties, calculationProperties, loading, refetch } = usePropertyData();

useEffect(() => { refetch(); }, []);
```