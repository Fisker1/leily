# Supabase Edge Functions (HTTP APIs)

This project exposes serverless HTTP APIs via Supabase Edge Functions. Endpoints accept JSON and reply with JSON. `OPTIONS` preflight is handled with permissive CORS.

Base invocation (client):

```ts
const { data, error } = await supabase.functions.invoke('<function-name>', { body: { /* payload */ } });
```

## property-valuation

- Path: `supabase/functions/property-valuation/index.ts`
- Method: `POST`
- Purpose: Estimate property value using Kartverket and fallbacks.

Request body:
```json
{ "address": "string", "postalCode": "string?", "city": "string?", "propertyId": "string?" }
```

Success (200):
```json
{ "estimatedValue": 3200000, "confidence": "low|medium|high", "source": "kartverket|estimated", "address": "string", "propertyData": {} }
```

Example:
```ts
await supabase.functions.invoke('property-valuation', { body: { address: 'Karl Johans gate 1', postalCode: '0154', city: 'Oslo' } });
```

---

## market-analysis

- Path: `supabase/functions/market-analysis/index.ts`
- Method: `POST`
- Purpose: Compute rental market data using updated assumptions with fallbacks.

Request body:
```json
{ "address": "string", "city": "string?", "postal_code": "string?", "property_type": "Leilighet", "size_sqm": 70, "current_rent": 20000 }
```

Success (200):
```json
{ "marketData": { "averageRent": 20000, "medianRent": 19200, "rentRange": { "min": 17000, "max": 23600 }, "marketTrend": "stigende", "dataSource": "string", "lastUpdated": "ISO", "municipality": "string", "propertyType": "string" } }
```

---

## geocode-address

- Path: `supabase/functions/geocode-address/index.ts`
- Method: `POST`
- Purpose: Geocode via Mapbox with retries/backoff.

Request body:
```json
{ "address": "string", "city": "string?", "country": "NO" }
```

Success (200):
```json
{ "coordinates": [10.75, 59.91], "place_name": "string", "address": "string", "success": true }
```

---

## get-mapbox-token

- Path: `supabase/functions/get-mapbox-token/index.ts`
- Method: `POST`
- Purpose: Return validated Mapbox public token.

Success (200):
```json
{ "success": true, "token": "pk.***", "tokenPrefix": "pk.ey...", "tokenLength": 123 }
```

---

## rate-limiter

- Path: `supabase/functions/rate-limiter/index.ts`
- Method: `POST`
- Purpose: Generic rate limiting.

Request body:
```json
{ "endpoint": "string", "identifier": "string" }
```

429:
```json
{ "error": "Rate limit exceeded", "retryAfter": 300, "details": { "maxRequests": 5, "windowMinutes": 15 } }
```

---

## copy-production-data

- Path: `supabase/functions/copy-production-data/index.ts`
- Method: `POST`
- Purpose: Copies whitelisted tables from production to current env.

Success (200):
```json
{ "success": true, "copiedTables": ["profiles", "properties"], "totalRecords": 1234 }
```