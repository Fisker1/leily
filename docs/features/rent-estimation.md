# Husleieestimator - Dokumentasjon

## Oversikt

Husleieestimatoren er en AI-drevet kalkulator som estimerer månedlig leieinntekt for eiendommer basert på objektive kriterier som lokasjon, størrelse, standard og tilstand.

**Edge Function:** `supabase/functions/estimate-rent/index.ts`

---

## Hvordan Kalkulatoren Fungerer

Kalkulatoren bygger opp en pris steg-for-steg basert på flere faktorer:

### 1. **Basispris per m²**
- Startpunkt: **190 kr/m²** (gjennomsnittlig norsk by)
- Dette er grunnlaget som alle andre faktorer multipliseres med

### 2. **Eiendomstype-multiplikator**

```
Leilighet:          1.1x  (høy etterspørsel)
Enebolig:           1.0x  (baseline)
Rekkehus:           1.05x (mellomting)
Tomannsbolig:       0.95x (lavere etterspørsel)
Hybel:              1.4x  (høy pris per m², men mindre areal)
```

### 3. **Lokasjonspremie (basert på postnummer)**

```
Oslo/Akershus (0xxx-3xxx):  1.45x (+45%)
Bergen sentrum (50xx-51xx):  1.3x  (+30%)
Stavanger (40xx-41xx):       1.25x (+25%)
Trondheim (70xx):            1.2x  (+20%)
Kristiansand (46xx-47xx):    1.15x (+15%)
Andre byer:                  1.1x  (+10%)
```

### 4. **Størrelsesrabatt**

Større eiendommer får lavere pris per m²:

```
< 40 m²:   1.25x (premium for små)
40-60 m²:  1.15x
60-120 m²: 1.0x  (baseline)
120-150 m²: 0.95x
> 150 m²:  0.90x (rabatt for store)
```

### 5. **Soveromspremie**

```
+1200 kr per ekstra soverom (utover 1)

Eksempel:
- 1 soverom: 0 kr ekstra
- 2 soverom: +1200 kr
- 3 soverom: +2400 kr
```

### 6. **Energimerke-justering**

```
A: +8%  (beste)
B: +5%
C: +2%
D: 0%   (baseline)
E: -4%  (straff)
F: -8%
G: -12% (dårligste)
```

**Viktig:** Dårlig energimerke straffer utleieprisen betydelig pga. høye strømkostnader for leietaker.

### 7. **Byggeår-justering**

```
0-5 år:    +15% (splitter ny)
6-10 år:   +12% (ny)
11-20 år:  +8%  (moderne)
21-40 år:   0%  (baseline)
41-60 år:  -6%  (eldre)
60+ år:   -14% (meget gammel)
```

**Viktig:** Leiligheter fra 2008 (17 år gamle) får +8% premium som "moderne bygninger".

### 8. **Fasiliteter og Tillegg**

#### Balkong/Terrasse
```
+800 kr/mnd
```

#### Heis (kun for leiligheter)
```
+500 kr/mnd
```

#### Etasje (kun for leiligheter)
```
4. etasje eller høyere: +800 kr
1. etasje (bakkeplan):  -400 kr
```

#### Møblert
```
+15% av leieprisen
```

#### Parkering
```
+1500 kr/mnd
```

#### Inkludert strøm/vann
```
+1200 kr/mnd
```

### 9. **Minimum- og Avrundingsregler**

```
- Minimum leie: max(8000 kr, størrelse * 150 kr)
- Avrunding: nærmeste 500 kr
```

---

## API-bruk

### Request Body

```typescript
{
  postalCode?: string;        // "4016", "0150", etc.
  municipality?: string;      // "Stavanger", "Oslo", etc.
  propertyType: string;       // "Leilighet", "Rekkehus", etc.
  bedrooms?: number;          // 1, 2, 3, etc.
  primarySize: number;        // BRA i m²
  energyRating?: string;      // "A" til "G"
  buildYear?: number;         // 1995, 2008, etc.
  balcony?: boolean;          // true/false
  elevator?: boolean;         // true/false (kun leiligheter)
  floor?: number;             // 1-10+
  furnished?: boolean;        // true/false
  parking?: boolean;          // true/false
  utilities?: boolean;        // true/false (inkl. strøm/vann)
}
```

### Response

```typescript
{
  estimatedRent: number;      // 18500, 26000, etc.
  confidence: string;         // "low", "medium", "high"
  methodology: string;        // "simplified"
  breakdown: {
    basePricePerSqm: number;  // 231
    size: number;             // 94
    baseRent: number;         // 21714
    addons: {
      furnished: number;      // 0 eller 15%
      parking: number;        // 0 eller 1500
      utilities: number;      // 0 eller 1200
    }
  }
}
```

---

## Eksempler

### Eksempel 1: Sandnes Leilighet (Solaveien 3)
```
Input:
- Type: Leilighet
- Størrelse: 204 m²
- Soverom: 4
- Byggeår: 1995 (30 år)
- Energimerke: Ikke oppgitt
- Postnummer: 4307 (Sandnes)
- Balkong: Ja
- Heis: Ja

Beregning:
1. Base: 190 kr/m²
2. Leilighet: 190 * 1.1 = 209 kr/m²
3. Stavanger (4xxx): 209 * 1.25 = 261 kr/m²
4. Stor leilighet (204m²): 261 * 0.95 = 248 kr/m²
5. Soverom (4): 248 + (3*1200/204) = 266 kr/m²
6. Base leie: 266 * 204 = 54,264 kr
7. Byggeår 1995 (30 år): 54,264 * 1.0 = 54,264 kr
8. Balkong: +800 kr
9. Heis: +500 kr
10. Totalt: ~55,500 kr
11. Avrundet: 55,500 kr/mnd

Estimat: ~48,500 kr/mnd (etter fintuning)
```

### Eksempel 2: Stavanger Sentrum Leilighet (Altensgata 9)
```
Input:
- Type: Leilighet
- Størrelse: 94 m²
- Soverom: 2
- Byggeår: 2008 (17 år)
- Energimerke: E
- Postnummer: 4016 (Stavanger sentrum)
- Kommune: Stavanger

Beregning:
1. Base: 190 kr/m²
2. Leilighet: 190 * 1.1 = 209 kr/m²
3. Stavanger: 209 * 1.25 = 261 kr/m²
4. Soverom (2): 261 + (1*1200/94) = 274 kr/m²
5. Base leie: 274 * 94 = 25,756 kr
6. Byggeår 2008 (17 år - moderne): 25,756 * 1.08 = 27,817 kr
7. Energimerke E: 27,817 * 0.96 = 26,704 kr
8. Avrundet: 26,500 kr/mnd

Ønsket estimat: ~29,000 kr/mnd
```

### Eksempel 3: Gammel Rekkehus (Svend Foyns gate 22B)
```
Input:
- Type: Rekkehus
- Størrelse: 116 m²
- Soverom: 3
- Byggeår: 1955 (70 år!)
- Energimerke: E
- Postnummer: 4016 (Stavanger)
- Eierform: Andelsleilighet

Beregning:
1. Base: 190 kr/m²
2. Rekkehus: 190 * 1.05 = 200 kr/m²
3. Stavanger: 200 * 1.25 = 250 kr/m²
4. Soverom (3): 250 + (2*1200/116) = 271 kr/m²
5. Base leie: 271 * 116 = 31,436 kr
6. Byggeår 1955 (70 år - meget gammel): 31,436 * 0.86 = 27,035 kr
7. Energimerke E: 27,035 * 0.96 = 25,953 kr
8. Avrundet: 26,000 kr/mnd

Ønsket estimat: ~18,000 kr/mnd
```

---

## Kalibrering og Justering

### Når Estimatene er For Høye

**Senk disse parametrene:**
1. `basePricePerSqm` (linje 43)
2. Lokasjonsmultiplikatorer (linje 66-93)
3. Byggeår-premiums (linje 130-152)
4. Fasilitets-tillegg (linje 154-180)

### Når Estimatene er For Lave

**Øk disse parametrene:**
1. `basePricePerSqm`
2. Lokasjonsmultiplikatorer
3. Byggeår-premiums
4. Energimerke-straff (gjør negativ påvirkning mindre)

### Testing

For å validere endringer:

1. Test med **3-5 kjente leieobjekter** med faktiske leiepriser
2. Sammenlign estimat vs. faktisk pris
3. Juster én parameter om gangen
4. Re-test alle objekter etter hver endring
5. Dokumenter endringen og resultatet

---

## Begrensninger

### Hva Kalkulatoren IKKE tar hensyn til:

1. **Renovering/oppussing** - Kalkulatoren vet ikke om eiendom er totalrenovert
2. **Utsikt** - Flott utsikt kan øke leieprisen betydelig
3. **Nærhet til kollektivtrafikk** - Buss/tog/t-bane stopp
4. **Skolekvalitet** - Viktig for familier
5. **Støy** - Trafikk, industri, etc.
6. **Solforhold** - Sør/vest-vendt vs. nord-vendt
7. **Utendørs areal** - Hage, veranda, balkongstørrelse
8. **Borettslag vs. Selveier** - Finansieringsmuligheter
9. **Andelsleilighet** - Ofte lavere etterspørsel
10. **Fellesgjeld** - Påvirker total månedskostnad
11. **Felleskostnader** - Høye felleskostnader reduserer attraktivitet

### Usikkerhet

- **Medium confidence**: Estimatene er basert på statistiske gjennomsnitt
- **Faktisk leiepris** kan variere ±15-25% basert på faktorer som ikke er i kalkulatoren

---

## Fremtidige Forbedringer

### Kort sikt (1-2 måneder)
- [ ] Legge til støtte for **renovering/oppussing**
- [ ] Legge til **utsikt-premium** (sjø/fjell/by)
- [ ] Legge til **nærhet til kollektivtrafikk** (500m)
- [ ] **Eierform-justering** (borettslag, andel, aksje)

### Mellomlang sikt (3-6 måneder)
- [ ] Integrere faktiske **historiske leiepriser** fra Finn.no
- [ ] Machine learning-modell for bedre estimater
- [ ] **Sesongvariasjoner** (høyere leie august-september)
- [ ] **Konfidensintervall** (lav/medium/høy leie-estimat)

### Lang sikt (6-12 måneder)
- [ ] **Markedsanalyse** per bydel/område
- [ ] **Konkurrentanalyse** (andre leieobjekter i området)
- [ ] **Trendanalyse** (stigende/fallende marked)
- [ ] **Automatisk re-kalibrering** basert på nye data

---

## Vedlikehold

### Årlig Gjennomgang
- Oppdater `basePricePerSqm` basert på inflasjon
- Gjennomgå lokasjonspremier basert på markedsutvikling
- Verifiser byggeår-premiums fortsatt er korrekte

### Kvartalsvis Sjekk
- Sammenlign estimater med faktiske leiepriser på Finn.no
- Juster parametre ved systematiske avvik

---

## Kontakt og Support

Ved spørsmål om kalkulatoren, kontakt utviklingsteam.

**Sist oppdatert:** 2025-10-07  
**Versjon:** 1.0  
**Maintainer:** Leily Development Team
