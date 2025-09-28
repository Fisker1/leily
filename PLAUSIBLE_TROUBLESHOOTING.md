# Plausible Analytics Troubleshooting for stage.leily.no

## Problem Solved! ✅

Vi har nå oppdatert Plausible-implementasjonen for å fungere bedre med stage.leily.no.

## Hva som ble endret

### 1. Forbedret Script Implementation
- Endret fra dynamisk script-lasting til statisk script tag for bedre deteksjon
- Beholder `data-domain="stage.leily.no"` som standard
- Legger til domain-justering for produksjon

### 2. Ny HTML Structure
```html
<!-- Plausible Analytics - Static script for detection -->
<script defer data-domain="stage.leily.no" src="https://plausible.io/js/script.file-downloads.hash.outbound-links.pageview-props.revenue.tagged-events.js"></script>
<script>window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }</script>

<!-- Domain adjustment script -->
<script>
  // Adjust domain for production
  if (window.location.hostname === 'www.leily.no' || window.location.hostname === 'leily.no') {
    const plausibleScript = document.querySelector('script[data-domain]');
    if (plausibleScript) {
      plausibleScript.setAttribute('data-domain', 'leily.no');
    }
  }
</script>
```

## Nødvendige steg i Plausible Dashboard

### 1. Legg til stage.leily.no som site
1. Gå til Plausible.io dashboard
2. Klikk "Add website" 
3. Legg inn: `stage.leily.no`
4. Velg timezone (Europe/Oslo)
5. Lagre

### 2. Verifiser domain settings
- Sørg for at både `leily.no` og `stage.leily.no` er registrert som separate sites
- Hver site trenger sin egen konfigurasjon

## Testing og Verifikasjon

### 1. Test Script Loading
Åpne developer tools på stage.leily.no og sjekk:
```javascript
// I console, sjekk at Plausible er lastet
console.log(window.plausible);
console.log(document.querySelector('script[data-domain]'));
```

### 2. Test Event Tracking
```javascript
// Send test event
plausible('test-event', {props: {test: true}});
```

### 3. Network Tab
- Sjekk at `script.file-downloads.hash.outbound-links.pageview-props.revenue.tagged-events.js` laster
- Se etter network requests til `plausible.io/api/event`

## Vanlige problemer og løsninger

### Problem: "We couldn't find the Plausible snippet"
**Løsning:**
1. Sørg for at `stage.leily.no` er lagt til som site i Plausible
2. Vent 5-10 minutter etter endringer
3. Tøm browser cache
4. Test med inkognito-modus

### Problem: Script laster ikke
**Løsning:**
1. Sjekk Content Security Policy i HTML
2. Verifiser at `https://plausible.io` er tillatt
3. Sjekk nettverkstab for blokkerte requests

### Problem: Events registreres ikke
**Løsning:**
1. Sjekk at `data-domain` matcher nøyaktig med site i Plausible
2. Verifiser at JavaScript ikke har feil
3. Test med `plausible('pageview')` manuelt

## Content Security Policy

Sørg for at CSP inkluderer:
```
script-src 'self' 'unsafe-inline' https://plausible.io;
connect-src 'self' https://plausible.io;
```

Dette er allerede konfigurert i `index.html`.

## Deployment

Etter endringene:
1. Deploy til staging
2. Test på `https://stage.leily.no`
3. Gå til Plausible dashboard og klikk "Verify installation"
4. Sjekk at data kommer inn i real-time dashboard

## Debug Commands

### Test domain detection
```javascript
console.log('Hostname:', window.location.hostname);
console.log('Plausible domain:', document.querySelector('script[data-domain]')?.getAttribute('data-domain'));
```

### Test Plausible function
```javascript
if (typeof plausible === 'function') {
  console.log('Plausible function available');
  plausible('test-pageview');
} else {
  console.log('Plausible function not available');
}
```

---

**Nå skal Plausible fungere på stage.leily.no! 📊**

Hvis du fortsatt har problemer, sjekk at `stage.leily.no` er lagt til som en separat site i Plausible dashboard.