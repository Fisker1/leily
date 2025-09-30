# Fremtidige Funksjoner

Dette dokumentet inneholder planlagte funksjoner som skal implementeres i fremtiden.

## Leiekort (Rental Card)

### Oversikt
Et "leiekort" skal legges til på "Min side" som viser brukerens leie-ID og vervekode.

### Vervesystem (Referral System)

#### Vervekode
- Hver bruker får en unik vervekode
- Vervekoden kan deles med andre som skal opprette en konto

#### Belønningsstruktur

**Når en vervet person kjøper credits:**
- Du får 50% av de kjøpte creditsene som bonus til din konto

**Når en vervet person oppretter et leieforhold:**
- Du får 1 måned gratis på ditt første aktive leieforhold
- Hvis du har 3 aktive utleieavtaler, får du 1 måned gratis totalt (ikke per avtale)

#### Fleksibel bruk av gratis måneder
- Brukeren kan velge hvilken leilighet den gratis måneden skal gjelde for
- Brukeren kan velge når på året den gratis måneden skal "invoces"
- Gratis måneder akkumuleres: Hvis du har vervet 5 personer og ikke brukt kodene, får du 5 måneder gratis
- Disse 5 månedene kan fordeles fritt mellom dine leiligheter og tidspunkter

### Tekniske komponenter som må implementeres
- Leiekort UI-komponent på Min side
- Unik vervekode-generering for hver bruker
- System for å spore vervede brukere
- Kredittbonus-logikk (50% av vervet brukers kjøp)
- Gratis måneder-akkumulering og allokering
- UI for å velge hvilken leilighet og måned som skal være gratis
- Database-tabeller for å spore:
  - Vervekoder per bruker
  - Vervede brukere og deres status
  - Akkumulerte gratis måneder
  - Historikk over brukte gratis måneder

### Database-skjema (forslag)
```sql
-- Vervekoder
CREATE TABLE referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  code text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Vervede brukere
CREATE TABLE referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES auth.users(id),
  referred_user_id uuid REFERENCES auth.users(id),
  referral_code text,
  credits_bonus_given boolean DEFAULT false,
  free_month_given boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Gratis måneder
CREATE TABLE free_months (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  earned_from_referral_id uuid REFERENCES referrals(id),
  lease_id uuid REFERENCES lease_agreements(id) NULL,
  month_applied date NULL,
  is_used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  used_at timestamp with time zone NULL
);
```

### UI/UX komponenter
- Leiekort-widget på Min side
- Vervekode-display med "kopier"-funksjonalitet
- Oversikt over vervede brukere
- Oversikt over akkumulerte gratis måneder
- Interface for å velge og aktivere gratis måneder på spesifikke leieforhold
