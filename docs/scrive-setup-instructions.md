# Scrive API Setup - Instruksjoner

## 🔑 API-nøkler som må legges til

Du må legge til følgende environment variables i Supabase:

### 1. Gå til Supabase Dashboard
- Logg inn på [supabase.com](https://supabase.com)
- Velg ditt prosjekt
- Gå til **Settings** → **Edge Functions**

### 2. Legg til Environment Variables

Klikk på **Environment Variables** og legg til:

```bash
# Scrive API Credentials
SCRIVE_API_KEY=din_scrive_api_nøkkel_her
SCRIVE_BASE_URL=https://api.scrive.com/v2
```

### 3. Hvor finner du Scrive API-nøkkelen?

1. **Logg inn på Scrive Developer Portal:**
   - Gå til [developer.scrive.com](https://developer.scrive.com)
   - Logg inn med din Scrive-konto

2. **Opprett et nytt prosjekt:**
   - Klikk "Create New Project"
   - Gi prosjektet et navn (f.eks. "Leily Integration")
   - Velg "Test Environment" for utvikling

3. **Hent API-nøkkelen:**
   - Gå til "API Keys" i prosjektet
   - Kopier API-nøkkelen
   - Lim inn i `SCRIVE_API_KEY` variabelen

### 4. Test API-nøkkelen

Du kan teste at API-nøkkelen fungerer ved å kjøre:

```bash
curl -H "Authorization: Bearer DIN_API_NØKKEL" \
     https://api.scrive.com/v2/documents
```

## 🚀 Deploy Edge Functions

Etter at du har lagt til API-nøklene, deploy Edge Functions:

```bash
# Deploy alle functions
supabase functions deploy

# Eller deploy bare Scrive-functions
supabase functions deploy scrive-signing
supabase functions deploy send-signing-notification
```

## 📋 Database Migrations

Kjør database-migrasjonene:

```bash
# Kjør migrasjoner
supabase db push

# Eller hvis du bruker lokal utvikling
supabase migration up
```

## 🧪 Test Signeringsflyten

### 1. Opprett en leieavtale
- Gå til Dashboard
- Klikk "Opprett leieavtale"
- Fyll ut alle detaljer
- Klikk "Send til BankID-signering"

### 2. Test signeringsprosessen
- Last opp en PDF med leieavtalen
- Fyll ut signeringsdetaljer
- Send for signering
- Sjekk at e-post sendes til alle parter

### 3. Verifiser i Scrive Dashboard
- Logg inn på [app.scrive.com](https://app.scrive.com)
- Se at dokumentet er opprettet
- Test signeringsprosessen

## 🔧 Troubleshooting

### API-nøkkel fungerer ikke
- Sjekk at nøkkelen er riktig kopiert
- Verifiser at du bruker test-environment
- Sjekk at nøkkelen ikke har utløpt

### Edge Functions feiler
- Sjekk logs i Supabase Dashboard
- Verifiser at environment variables er satt
- Test API-nøkkelen manuelt

### E-post sendes ikke
- Sjekk at `send-leily-email` function fungerer
- Verifiser e-postadresser
- Sjekk spam-mappe

## 📚 Scrive API Dokumentasjon

- [Scrive API Docs](https://docs.scrive.com/)
- [Scrive Developer Portal](https://developer.scrive.com/)
- [Scrive SDK](https://github.com/scrive/sdk)

## 🎯 Neste steg

Etter at Scrive er satt opp:

1. **Test signeringsflyten** med ekte dokumenter
2. **Konfigurer e-postmaler** for signeringsnotifikasjoner
3. **Implementer webhook** for status-oppdateringer
4. **Legg til BankID-integrasjon** for norske brukere
5. **Test med ekte leieavtaler** før produksjonslansering

## 🔐 Sikkerhet

- **Ikke del API-nøkler** i kode eller dokumentasjon
- **Bruk test-environment** for utvikling
- **Rotér nøkler** regelmessig
- **Overvåk API-bruk** for uvanlig aktivitet

## 📞 Support

Hvis du trenger hjelp:
- [Scrive Support](https://support.scrive.com/)
- [Leily Support](mailto:support@leily.no)

