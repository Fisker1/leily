# Finn.no Integration System

Dette dokumentet beskriver hvordan Finn.no-integrasjonen fungerer i eiendomskalkulatoren.

## Oversikt

Systemet har to nivåer:

### 🆓 Gratisbrukere
- **Manuell utfylling**: Kan fylle ut kalkulatoren manuelt med all nødvendig informasjon
- **Finn-kode referanse**: Kan legge inn Finn-kode som referanse (lagres med kalkulasjonen)
- **Full tilgang**: Får tilgang til grunnleggende bankrapport basert på manuelle data

### 💎 Pro-brukere
- **Automatisk henting**: Kan hente eiendomsdata automatisk fra Finn.no ved hjelp av Finn-kode
- **Manual override**: Kan redigere auto-hentede data manuelt
- **Cache-system**: Data caches i 24 timer for bedre ytelse
- **Rate limiting**: Beskyttet mot for mange forespørsler

## Teknisk implementering

### Komponenter

1. **FinnPropertyFetcher** (`/src/components/calculator/FinnPropertyFetcher.tsx`)
   - Håndterer brukergrensesnitt for Finn-kode input
   - Viser hentet eiendomsdata
   - Kun tilgjengelig for Pro-brukere

2. **Supabase Edge Function** (`/supabase/functions/finn-property-scraper/index.ts`)
   - Scraper eiendomsdata fra Finn.no
   - Håndterer autentisering og abonnementskontroll
   - Implementerer rate limiting og caching

3. **Database** (`finn_property_cache` tabell)
   - Cacher hentet data i 24 timer
   - Reduserer belastning på Finn.no
   - Forbedrer brukeropplevelse

### Dataflyt

```
1. Pro-bruker legger inn Finn-kode
2. System validerer kode-format (8-9 siffer)
3. Sjekker cache først (24 timer)
4. Hvis ikke cached: Scraper fra Finn.no
5. Parser og strukturerer data
6. Fyller ut kalkulator automatisk
7. Bruker kan overstyre verdier manuelt
```

### Sikkerhet

- **Autentisering**: Krever gyldig bruker-token
- **Abonnementskontroll**: Kun Pro/Premium brukere
- **Rate limiting**: Maksimalt 10 forespørsler per time per bruker
- **Input validering**: Validerer Finn-kode format
- **Error handling**: Omfattende feilhåndtering

## Utvikling vs Produksjon

### Utvikling (DEV)
- Bruker mock-data fra `/src/utils/finnScraper.ts`
- Simulerer forskjellige eiendomstyper basert på Finn-kode
- Ingen ekte web scraping

### Produksjon
- Bruker Supabase Edge Function
- Ekte web scraping fra Finn.no
- Cache og rate limiting aktivt

## Bruk

### For gratisbrukere:
1. Gå til kalkulatoren
2. Fyll ut alle felt manuelt
3. Legg eventuelt inn Finn-kode som referanse
4. Generer grunnleggende rapport

### For Pro-brukere:
1. Gå til kalkulatoren
2. Se "Automatisk henting fra Finn.no" øverst
3. Legg inn Finn-kode (8-9 siffer)
4. Klikk "Hent eiendomsdata"
5. Data fylles ut automatisk
6. Rediger verdier om nødvendig
7. Generer rapport

## Finn-kode format

- **8-9 siffer**: F.eks. `123456789`
- **Fra URL**: `finn.no/realestate/homes/ad/123456789`
- **Validering**: Kun numeriske verdier aksepteres

## Feilhåndtering

- **Ugyldig kode**: Viser feilmelding om format
- **Eiendom ikke funnet**: Informerer bruker
- **Rate limit**: Ber bruker vente
- **Nettverksfeil**: Foreslår å prøve igjen senere

## Fremtidige forbedringer

- [ ] Støtte for flere eiendomsportaler
- [ ] Avansert parsing av eiendomsdetaljer
- [ ] Automatisk oppdatering av cached data
- [ ] Bulk-import av flere eiendommer
- [ ] API for tredjepartsintegrasjoner