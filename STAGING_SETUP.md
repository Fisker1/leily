# Staging Environment Setup - Testbruker "blåmeis"

## Problem Løst! 🎉

Vi har nå implementert automatisk opprettelse av testbrukeren "blåmeis" for staging-miljøet.

## Hvordan det fungerer

### Automatisk brukeroppretting
- Når du prøver å logge inn med `anderslundoy@protonmail.com` / `blåmeis` i staging
- Og brukeren ikke eksisterer
- Vil systemet automatisk opprette brukeren med:
  - ✅ Premium abonnement (1 år)
  - ✅ Admin-rolle
  - ✅ Bekreftet epost
  - ✅ Korrekt profil

### Staging-deteksjon
Systemet gjenkjenner staging-miljø basert på URL:
- `stage.leily.no`
- `localhost`
- `*.vercel.app`

## Bruk

### På landingssiden (stage.leily.no)
1. Gå til innlogging
2. Velg "Stager" knappen (🥷)
3. Skriv inn passord: `blåmeis`
4. Første gang: Bruker opprettes automatisk
5. Deretter: Normal innlogging

### På Auth-siden (/auth)
1. Klikk "Fyll inn test-bruker" knappen
2. Logg inn som vanlig
3. Første gang: Automatisk brukeroppretting

## Teknisk implementering

### Edge Function
- `/supabase/functions/create-staging-user/index.ts`
- Oppretter bruker via Supabase Admin API
- Kun tillatt i staging-miljø
- Setter opp profil og roller automatisk

### Frontend
- `AuthContext.tsx`: Automatisk retry etter brukeroppretting
- `SimpleAuth.tsx`: Stager-knapp med auto-oppretting
- `Auth.tsx`: Test-bruker fylling med staging-deteksjon

### Sikkerhet
- Kun aktiv i staging-miljø
- Validerer miljø før brukeroppretting
- Logger all aktivitet i audit_log

## Feilsøking

### Hvis automatisk oppretting feiler
1. Gå til Supabase Dashboard
2. Authentication → Users
3. Opprett bruker manuelt:
   - Email: `anderslundoy@protonmail.com`
   - Password: `blåmeis`
   - Confirm email: ✅

### Hvis Edge Function ikke fungerer
Sjekk at Edge Function er deployet:
```bash
supabase functions deploy create-staging-user
```

### Hvis roller/profil mangler
Kjør migrasjoner som setter opp roller:
- `20250913083224_*.sql`
- `20250913083312_*.sql`

## Miljøvariabler

For staging må disse være satt:
```env
VITE_ENVIRONMENT=staging
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-staging-anon-key
VITE_SUPABASE_PROJECT_ID=your-staging-project-id
VITE_APP_URL=https://stage.leily.no
```

## Testing

Etter deploy til staging:
1. Gå til `https://stage.leily.no`
2. Klikk innlogging
3. Test "Stager" knappen med passord `blåmeis`
4. Verifiser at du kommer inn med admin-tilgang
5. Sjekk at alle funksjoner fungerer

---

**Nå skal testbrukeren "blåmeis" fungere perfekt på stage.leily.no! 🥷**