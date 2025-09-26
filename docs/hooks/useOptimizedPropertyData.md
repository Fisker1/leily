# `useOptimizedPropertyData` (`src/hooks/useOptimizedPropertyData.tsx`)

Optimized variant of property/calculation data fetching with:
- Request throttling (min 10s between fetches unless forced)
- Backend-first geocoding via `geocode-address`, fallback to Nominatim
- Batching and rate limiting of geocoding
- Persistence of coordinates back to DB when available

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
const { properties, calculationProperties, loading, refetch } = useOptimizedPropertyData();

// Force refresh after a user action
await refetch();
```