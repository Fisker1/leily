# E-postadresser for Leily

Sist oppdatert: 10. oktober 2025

## Oversikt over operative e-postadresser

Leily bruker følgende e-postadresser for forskjellige formål:

### 1. **noreply@leily.no**
- **Formål**: Automatiske utsendelser (leieavtaler, varslinger, bekreftelser)
- **Brukes i**: 
  - `supabase/functions/send-lease-notification/index.ts` (leieavtale-signeringer)
  - Andre automatiserte e-postutsendelser
- **Konfigurasjon**: Må verifiseres i Resend med DKIM/SPF

### 2. **kontakt@leily.no**
- **Formål**: Generell kundehenvendelse og support
- **Brukes i**:
  - `src/components/legal/TermsOfService.tsx` (kontaktinfo og angrerett)
  - `src/components/FeedbackDialog.tsx` (tilbakemelding fra brukere)
  - `src/contexts/LanguageContext.tsx` (kontaktlenker)
- **Håndtering**: Hovedinnboks for kundesupport

### 3. **personvern@leily.no**
- **Formål**: GDPR-henvendelser og personvernforespørsler
- **Brukes i**:
  - `src/components/legal/TermsOfService.tsx` (personvernkontakt)
  - `src/components/legal/PrivacyPolicy.tsx` (personvernerklæring)
  - `src/components/legal/DataSubjectRights.tsx` (GDPR-rettigheter)
  - `src/contexts/LanguageContext.tsx` (personvernlenker)
- **Håndtering**: Spesialisert for personvernforespørsler

### 4. **admin@leily.no**
- **Formål**: Interne testkontoer og administrativ tilgang
- **Brukes i**: Testdata og utviklingsmiljø
- **Håndtering**: Kun internt

### 5. **dmarc@leily.no**
- **Formål**: Motta DMARC-rapporter fra e-postsystemer
- **Konfigurasjon**: DNS TXT-post `_dmarc.leily.no`
- **Håndtering**: Automatiske rapporter for e-postsikkerhet

## Test-kontoer (kun staging/utvikling)
- `gjest@leily.no` - Gjestebruker
- `pro@leily.no` - Pro-bruker testing
- `ambassador@leily.no` - Ambassadør-testing

## Historiske endringer

### 10. oktober 2025 - Standardisering til norsk
**Endringer gjort:**
1. ✅ Rettet `noreply@alquiz.no` → `noreply@leily.no` i `send-lease-notification/index.ts`
2. ✅ Fjernet `support@leily.no` → bruker `kontakt@leily.no`
3. ✅ Fjernet `privacy@leily.no` → bruker `personvern@leily.no`
4. ✅ Fjernet `billing@leily.no` → konsolidert til `kontakt@leily.no`

**Begrunnelse:**
- Målgruppen er norske forbrukere
- Konsistent norsk språk i alle kontaktpunkter
- Redusert antall e-postadresser fra 10 til 5 operative

## Neste steg for implementering

### Fase 3: E-posttjenesteoppsettet
- [ ] Opprett e-postadresser i DNS/e-postleverandør
- [ ] Sett opp videresending hvis ønskelig
- [ ] Konfigurer DMARC, SPF og DKIM

### Fase 4: Resend-konfigurasjon
- [ ] Verifiser `leily.no` domenet i Resend Dashboard
- [ ] Legg til DNS-poster for DKIM/SPF
- [ ] Test utsendelse fra `noreply@leily.no`
- [ ] Verifiser at e-poster ikke går til spam

## DNS-konfigurasjon (referanse)

### DMARC
```
TXT _dmarc.leily.no
"v=DMARC1; p=quarantine; rua=mailto:dmarc@leily.no; pct=100"
```

### SPF (fra Resend)
```
TXT leily.no
"v=spf1 include:_spf.resend.com ~all"
```

### DKIM
Vil bli generert av Resend ved domeneverifisering.

## Kontakt for e-postadministrasjon
Ved spørsmål om e-postkonfigurasjon, kontakt teknisk ansvarlig.
