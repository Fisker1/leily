# Miljøoppsett Guide - Staging og Produksjon

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

## 2. Lovable Deployment

### Staging Site
1. I Lovable workspace, opprett ny side for staging
2. Sett environment variabler fra `.env.staging.example`
3. Koble til domene: `staging.leily.no`

### Produksjon Site
1. Opprett ny side for produksjon
2. Sett environment variabler fra `.env.production.example`
3. Koble til domene: `www.leily.no`

## 3. Environment Variabler

### For Staging (.env)
\`\`\`
VITE_ENVIRONMENT=staging
VITE_SUPABASE_URL=https://din-staging-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=din-staging-anon-key
VITE_SUPABASE_PROJECT_ID=din-staging-project-id
VITE_APP_URL=https://staging.leily.no
VITE_ENABLE_ANALYTICS=false
VITE_DEBUG=true
\`\`\`

### For Produksjon (.env)
\`\`\`
VITE_ENVIRONMENT=production
VITE_SUPABASE_URL=https://din-prod-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=din-prod-anon-key
VITE_SUPABASE_PROJECT_ID=din-prod-project-id
VITE_APP_URL=https://www.leily.no
VITE_ENABLE_ANALYTICS=true
VITE_DEBUG=false
\`\`\`

## 4. DNS Konfiguration

### Staging
- `staging.leily.no` → CNAME til Lovable
- SSL håndteres automatisk av Lovable

### Produksjon
- `www.leily.no` → A record til Lovable (185.158.133.1)
- SSL håndteres automatisk av Lovable

## 5. Supabase Auth Redirects

### Staging Supabase
Gå til Authentication → URL Configuration:
- Site URL: `https://staging.leily.no`
- Redirect URLs: `https://staging.leily.no/**`

### Produksjon Supabase
Gå til Authentication → URL Configuration:
- Site URL: `https://www.leily.no`
- Redirect URLs: `https://www.leily.no/**`

## 6. Deploy Workflow

1. **Utvikle lokalt** → Push til Git
2. **Deploy til staging** → Test på `staging.leily.no`
3. **Test komplett** (auth, betaling, webhooks)
4. **Deploy til produksjon** → `www.leily.no`
5. **Overvåk** for eventuelle problemer

## 7. Tredjepartstjenester

### Vipps
- Staging: Konfigurer test-API til staging webhooks
- Produksjon: Produksjons-API til produksjon webhooks

### Signering (hvis relevant)
- Staging: Test-environment til staging
- Produksjon: Produksjon til produksjon

## 8. Vedlikehold

### Database Migrasjoner
1. Test først i staging
2. Kjør samme migrasjoner i produksjon
3. Bruk expand/contract pattern for breaking changes

### Monitorering
- Staging: Debug mode aktivert
- Produksjon: Error tracking aktivert
- Analytics kun i produksjon

## 9. Sikkerhet

- Aldri del produksjons-secrets med staging
- Bruk separate API-nøkler for alle tjenester
- Test auth redirects nøye i begge miljøer

## Neste Steg
1. Opprett Supabase prosjektene
2. Konfigurer DNS
3. Sett opp Lovable sites med riktige env vars
4. Test staging grundig før produksjon