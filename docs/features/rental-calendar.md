# Leiekalender

## Oversikt

Leiekalenderen gir brukere en komplett oversikt over alle leierelaterte hendelser og viktige datoer. Den er integrert i brukerens dashboard (Min side) og automatiserer mange av de rutinemessige oppgavene knyttet til utleieforvaltning.

## Funksjoner

### 📅 Kalendervisning
- **Månedlig visning** med oversikt over alle hendelser
- **Fargekoding** for forskjellige hendelsestyper
- **Klikkbare datoer** for å opprette nye hendelser
- **Event-detaljer** ved klikk på hendelser

### 🏠 Automatisk hendelsesgenerering
Systemet genererer automatisk hendelser basert på eksisterende data:

#### Fra leieavtaler:
- **Leieavtale starter** - Dato for når leieavtalen trer i kraft
- **Innflytting** - Dato for når leietaker flytter inn
- **Indeksregulering** - Årlig regulering basert på konsumprisindeks
- **Leieavtale slutter** - Dato for når leieavtalen utløper
- **Utflytting** - Dato for når leietaker flytter ut
- **Depositum utbetaling** - Dato for når depositum kan utbetales

#### Fra eiendommer:
- **Årlig inspeksjon** - Planlagt inspeksjon av eiendom
- **Røykvarsler sjekk** - Årlig sjekk av røykvarslere
- **Forsikring fornyelse** - Årlig fornyelse av eiendomsforsikring

### 📊 Indeksregulering
Spesialfunksjon for å håndtere årlig indeksregulering av husleie:

- **Automatisk beregning** basert på konsumprisindeks
- **Foreslått ny husleie** med prosentvis økning
- **Planlegging** av reguleringsdato
- **Automatisk kalenderoppføring** med påminnelser

### 🎯 Hendelsestyper

| Type | Beskrivelse | Farge | Standard påminnelser |
|------|-------------|-------|---------------------|
| `lease_start` | Leieavtale starter | 🟢 Grønn | 7, 3, 1 dager |
| `lease_end` | Leieavtale slutter | 🔴 Rød | 30, 14, 7, 3, 1 dager |
| `move_in` | Innflytting | 🟢 Grønn | 7, 3, 1 dager |
| `move_out` | Utflytting | 🟠 Oransje | 14, 7, 3, 1 dager |
| `index_regulation` | Indeksregulering | 🔵 Blå | 30, 14, 7, 3 dager |
| `rent_increase` | Husleieøkning | 🟡 Gul | 14, 7, 3 dager |
| `inspection` | Inspeksjon | 🟣 Lilla | 7, 3, 1 dager |
| `deposit_release` | Depositum utbetaling | 🟢 Smaragd | 14, 7, 3 dager |
| `maintenance` | Vedlikehold | ⚫ Grå | 7, 3, 1 dager |
| `insurance_renewal` | Forsikring fornyelse | 🔵 Indigo | 60, 30, 14, 7 dager |
| `tax_deadline` | Skattefrist | 🔴 Rød | 30, 14, 7, 3 dager |
| `custom` | Egen hendelse | ⚫ Slate | 7, 3, 1 dager |

### 🔍 Filtrering og søk
- **Filtrer på hendelsestype** - Se kun spesifikke typer hendelser
- **Filtrer på eiendom** - Se hendelser for spesifikke eiendommer
- **Datoområde** - Begrens visning til spesifikt tidsrom
- **Status** - Vis fullførte eller ikke-fullførte hendelser
- **Hurtigfiltre** - I dag, neste uke, neste måned

### ⚙️ Hendelsesadministrasjon
- **Opprett hendelser** - Manuell opprettelse av nye hendelser
- **Rediger hendelser** - Endre eksisterende hendelser
- **Slett hendelser** - Fjerne hendelser
- **Fullfør/ikke-fullfør** - Markere hendelser som fullført
- **Gjentakende hendelser** - Årlige, månedlige eller kvartalsvise hendelser

## Teknisk implementasjon

### Database-schema
```sql
CREATE TABLE user_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  property_id UUID REFERENCES properties(id),
  lease_id UUID REFERENCES lease_agreements(id),
  is_recurring BOOLEAN DEFAULT false,
  recurring_pattern TEXT,
  reminder_days INTEGER[] DEFAULT ARRAY[7, 3, 1],
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Komponenter
- `RentalCalendar` - Hovedkalender-komponent
- `CalendarEventDialog` - Dialog for å opprette/redigere hendelser
- `CalendarEventFilters` - Filtreringskomponent
- `IndexRegulationDialog` - Spesialdialog for indeksregulering

### Hooks
- `useCalendarEvents` - Håndterer CRUD-operasjoner for kalenderhendelser
- `useAutoCalendarEvents` - Automatisk generering av hendelser fra eksisterende data

### Hjelpefunksjoner
- `calendarHelpers.ts` - Utility-funksjoner for kalenderberegninger
- Automatisk beregning av indeksreguleringsdatoer
- Generering av gjentakende hendelser

## Brukeropplevelse

### Dashboard-integrasjon
Kalenderen er integrert i brukerens dashboard (Min side) og vises som en egen seksjon under "Recent Activity". Dette gir brukerne rask tilgang til kalenderen uten å måtte navigere til en separat side.

### Automatisk oppdatering
Når brukere oppretter nye leieavtaler eller eiendommer, genereres automatisk relevante kalenderhendelser. Dette sikrer at ingen viktige datoer går tapt.

### Påminnelser
Alle hendelser kan ha påminnelser som sendes via e-post (når e-post-funksjonalitet er implementert). Standard påminnelser varierer etter hendelsestype.

## Fremtidige forbedringer

### Planlagte funksjoner
- **E-post påminnelser** - Automatiske påminnelser via e-post
- **Push-notifikasjoner** - Mobilnotifikasjoner for viktige hendelser
- **Kalender-synkronisering** - Integrasjon med Google Calendar/Outlook
- **Rapporter** - Månedlige/årlige rapporter over hendelser
- **AI-forslag** - Intelligente forslag basert på historiske data
- **Mobil-app** - Dedikert mobil-applikasjon

### Integrasjoner
- **Microsoft Graph API** - Synkronisering med Outlook
- **Google Calendar API** - Synkronisering med Google Calendar
- **SMS-tjenester** - SMS-påminnelser
- **Banking API** - Automatisk depositum-utbetaling

## Sikkerhet og personvern

- **Row Level Security (RLS)** - Brukere kan kun se sine egne hendelser
- **Data-kryptering** - Følsomme data krypteres
- **Audit logging** - Alle endringer logges for sikkerhet
- **GDPR-compliance** - Følger norske og europeiske personvernregler





