# Language Context (`src/contexts/LanguageContext.tsx`)

Provides translations and language state.

## Public API

- `LanguageProvider`
  - Context provider with internal `language` state.
- `useLanguage()`
  - Returns `{ language, setLanguage, translations }`.

## Supported languages

- `'no'` (Norwegian, default)
- `'en'`
- `'sv'`
- `'da'`

## Usage

```tsx
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <MyScreen />
    </LanguageProvider>
  );
}

function MyScreen() {
  const { language, setLanguage, translations } = useLanguage();
  return (
    <div>
      <select value={language} onChange={(e) => setLanguage(e.target.value as any)}>
        <option value="no">Norsk</option>
        <option value="en">English</option>
        <option value="sv">Svenska</option>
        <option value="da">Dansk</option>
      </select>
      <h1>{translations.hero.title}</h1>
    </div>
  );
}
```