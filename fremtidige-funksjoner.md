# Fremtidige Funksjoner - Planlegging og Spesifikasjoner

Dette dokumentet inneholder en oversikt over planlagte funksjoner som skal implementeres i fremtiden.

## 1. Chat-funksjon mellom Huseier og Leietaker

### Beskrivelse
Når et leieforhold opprettes, skal det automatisk opprettes en dedikert chat mellom huseier og leietaker.

### Funksjonalitet
- **Automatisk opprettelse**: Chat opprettes automatisk ved opprettelse av leieforhold
- **Direkte kommunikasjon**: Huseier og leietaker kan kommunisere direkte i appen
- **Meldingshistorikk**: All kommunikasjon lagres og er tilgjengelig i chat-historikken
- **Eliminerer ekstern kommunikasjon**: Reduserer behovet for telefon og SMS

### Fordeler
- Samlet kommunikasjonshistorikk på ett sted
- Lettere oppfølging av avtaler og henvendelser
- Bedre dokumentasjon av kommunikasjon
- Mer effektiv kommunikasjon

---

## 2. Håndverker-funksjon med Telefonliste

### Beskrivelse
En funksjon som lar huseiere administrere og organisere kontaktinformasjon til håndverkere.

### Funksjonalitet
- **Kategoriserte håndverkere**: Ikoner for ulike fagområder
  - Byggeplanlegger
  - Tømrer
  - Elektriker
  - Rørlegger
- **Telefonliste**: Ved klikk på ikon vises telefonliste for den kategorien
- **Prioritert rekkefølge**: Drag-and-drop funksjonalitet for å organisere rekkefølge
- **Rask tilgang**: Pluss-knapp for å raskt legge til telefonnummer

### Arbeidsflyt
1. Leietaker sender melding om problem
2. Huseier trykker på relevant håndverker-ikon
3. Telefonliste vises i prioritert rekkefølge
4. Huseier kan ringe direkte eller legge til nye kontakter

### Fordeler
- Rask tilgang til riktig håndverker
- Organisert kontaktinformasjon
- Effektiv problemløsning
- Bedre service til leietakere

---

## 3. Brukertype-system for Testing og Utvikling

### Beskrivelse
Et system som gjør det enkelt å teste ulike brukernivåer og funksjonalitet under utvikling.

### Brukertyper
1. **Gratis bruker**
   - Tilgang til grunnleggende funksjonalitet
   - Begrenset funksjonssett
   
2. **Pro bruker**
   - Utvidet funksjonalitet
   - Flere funksjoner og muligheter
   
3. **Ambassadør bruker**
   - Full tilgang til alle funksjoner
   - Spesielle ambassadør-funksjoner

### Implementering for Testing
- **Innlogging med sosiale medier**: Google, Facebook, etc.
- **Brukertype-velger**: Dropdown eller knapper for å velge brukertype
- **Enkel bytte**: Mulighet for å enkelt bytte mellom brukertyper under testing
- **Funksjonell separasjon**: Hver brukertype har tilgang til sine respektive funksjoner

### Fordeler for Utvikling
- Enkel testing av alle brukernivåer
- Rask validering av funksjonalitet
- Effektiv kvalitetssikring
- Bedre brukeropplevelse-testing

---

## Implementeringsstatus
- [ ] Chat-funksjon mellom huseier og leietaker
- [ ] Håndverker-funksjon med telefonliste
- [ ] Brukertype-system for testing

## Notater
Dette dokumentet oppdateres etter hvert som nye funksjoner planlegges og eksisterende funksjoner implementeres.

---
*Opprettet: 26. september 2025*