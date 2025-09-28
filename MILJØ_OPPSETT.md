# Miljøoppsett Guide - Staging og Produksjon

## ✅ PROBLEM LØST! 

**Jeg har identifisert og løst problemet med at alle endringer gikk til produksjonsdatabasen i stedet for staging.**

### Hva var problemet?
I `src/integrations/supabase/client.ts` var det hardkodede fallback-verdier som pekte til produksjonsdatabasen (`wdwjmapvuibsqiifslno.supabase.co`) i stedet for å bruke miljøvariablene korrekt.

### Hva jeg har fikset:
1. **Oppdatert Supabase-klienten** til å bruke `ENV_CONFIG` fra `src/lib/env.ts`
2. **Fjernet hardkodede fallback-verdier** som pekte til feil database
3. **Sørget for at miljødetektering fungerer** korrekt

### Slik bytter du mellom miljøer nå:

**For Staging:**
```bash
cp .env.staging.example .env
```
Deretter oppdater `.env` med dine staging Supabase-detaljer.

**For Production:**
```bash
cp .env.production.example .env
```
Deretter oppdater `.env` med dine production Supabase-detaljer.

**Sjekk hvilket miljø du bruker:**
Åpne browser developer tools (F12) og kjør:
```javascript
console.log('Environment:', import.meta.env.VITE_ENVIRONMENT || 'development');
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
```

---

## Oversikt
Koden er nå forberedt for å støtte staging og produksjonsmiljøer. Her er hva som må gjøres for å fullføre oppsettet.

## 1. Supabase Prosjekter

### Opprett staging-prosjekt
1. Gå til [Supabase Dashboard](https://supabase.com/dashboard)
2. Opprett nytt prosjekt: `leily-staging`
3. Kopier alle migrasjoner fra eksisterende prosjekt
4. Seed med testdata
5. Konfigurer samme storage buckets

### Opprett produksjonsprosjekt
1. Opprett nytt prosjekt: `leily-production`
2. Kopier alle migrasjoner
3. **IKKE** kopier produksjonsdata til staging

## 2. Deploy

Bruk Vercel med to prosjekter: `leily-staging` og `leily-production`. Sett miljøvariabler i hvert prosjekt.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_ENVIRONMENT` (staging | production)
- `VITE_APP_URL` (https://staging... / https://www...)
- `SUPABASE_SERVICE_ROLE` (kun server/edge functions)

## 3. Environment Variabler

### For Staging (.env)
```
VITE_ENVIRONMENT=staging
VITE_SUPABASE_URL=https://din-staging-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=din-staging-anon-key
VITE_SUPABASE_PROJECT_ID=din-staging-project-id
VITE_APP_URL=https://staging.leily.no
VITE_ENABLE_ANALYTICS=false
VITE_DEBUG=true
```

### For Produksjon (.env)
```
VITE_ENVIRONMENT=production
VITE_SUPABASE_URL=https://din-prod-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=din-prod-anon-key
VITE_SUPABASE_PROJECT_ID=din-prod-project-id
VITE_APP_URL=https://www.leily.no
VITE_ENABLE_ANALYTICS=true
VITE_DEBUG=false
```

## 4. DNS Konfiguration

### Staging
- `staging.leily.no` → CNAME til Vercel

### Produksjon
- `www.leily.no` → Vercel

## 5. Supabase Auth Redirects

### Staging Supabase
Authentication → URL Configuration:
- Site URL: `https://staging.leily.no`
- Redirect URLs: `https://staging.leily.no/**`

### Produksjon Supabase
Authentication → URL Configuration:
- Site URL: `https://www.leily.no`
- Redirect URLs: `https://www.leily.no/**`

## 6. Deploy Workflow

1. Utvikle lokalt → Push til Git
2. CI: deploy til staging og kjør migrasjoner mot staging
3. Test komplett (auth, betaling, webhooks)
4. Promoter til produksjon

## 7. Sikkerhet

- Aldri del produksjons-secrets med staging
- Separate API-nøkler i alle tjenester
- Test auth redirects i begge miljøer

## 8. Verifikasjonssider

- `/__env`: viser miljø og Supabase host
- `/__health`: enkel helse-sjekk
- `/__supabase`: viser Supabase config (uten hemmeligheter)