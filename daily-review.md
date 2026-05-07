# Daily Code Review — 2026-05-07

Branch: `review/2026-05-07` (based on `stage`)

## Summary

Comprehensive code review covering frontend (React/TypeScript), backend (Supabase Edge Functions), and shared utilities. Found and fixed 15 issues across security, correctness, and code quality. Several additional items are documented below for future attention.

---

## Changes Made

### Critical Bug Fixes

1. **finn-property-scraper: Swapped function arguments** (`supabase/functions/finn-property-scraper/index.ts`)
   - `extractFinnDataWithAI(htmlContent, finnCode)` was called with arguments reversed vs. the function signature `(finnCode, htmlContent)`. This caused the AI extractor to receive the Finn code as HTML and vice versa, silently breaking all property scraping.
   - Also added a null check on `htmlContent` before accessing `.length`, preventing an unhandled exception when scraping fails.

2. **estimate-electricity: Invalid OpenAI model name** (`supabase/functions/estimate-electricity/index.ts`)
   - Model was set to `"gpt-5-mini-2025-08-07"` which does not exist. Changed to `"gpt-4o-mini"`. Every electricity estimate request was failing with a model-not-found error.

3. **Dashboard: Data leak — missing owner_id filter** (`src/features/dashboard/pages/Dashboard.tsx`)
   - Properties count query had no `owner_id` filter, returning the platform-wide count instead of the user's own properties.
   - Audit log query had no `user_id` filter, exposing other users' activity.
   - `useEffect` dependency array was empty `[]`, so dashboard data would never re-fetch if the user session loaded asynchronously. Added `[user]`.

4. **useCalculatorData: NaN propagation from empty strings** (`src/features/calculator/hooks/useCalculatorData.tsx`)
   - All calculator inputs are stored as `string` (initialized to `""`). `parseFloat("")` returns `NaN`, causing every ratio, yield, and cash flow to become `NaN`.
   - Added a `safeFloat()` helper and rewrote `getReportData` to guard against zero-division and NaN.

5. **signicat-signing: btoa fails on Norwegian characters** (`supabase/functions/signicat-signing/index.ts`)
   - `btoa(htmlTemplate)` throws `InvalidCharacterError` for æ, ø, å. Fixed with `btoa(unescape(encodeURIComponent(htmlTemplate)))`.

### Security Improvements

6. **signicat-signing: Webhook signature validation** (`supabase/functions/signicat-signing/index.ts`)
   - The webhook handler had a `TODO` for signature validation but never checked it. Any external party could POST forged signing events, marking leases as completed without BankID.
   - Implemented HMAC-SHA256 signature validation using `SIGNICAT_WEBHOOK_SECRET`. Falls back to a warning log if the secret is not configured.

7. **Supabase client: Fail-fast on missing env vars** (`src/shared/integrations/supabase/client.ts`)
   - Previously, missing `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` silently created a client pointed at `""`, causing cryptic network errors. Now throws a clear error message at startup.

8. **useCredits: Race condition on credit deduction** (`src/shared/hooks/useCredits.tsx`)
   - `useCredit()` read credits from local state and wrote `credits - 1` back. Two concurrent calls could both read the same value and only deduct 1 credit for 2 uses.
   - Now uses the existing `use_credits` RPC for atomic server-side decrement, and added a `credits <= 0` early return.
   - Also fixed the realtime channel name from a hardcoded `'credits-changes'` to `'credits-changes-${user.id}'` to prevent cross-instance collisions.

### Code Quality Improvements

9. **calculator-ai-chat: Removed dead code** (`supabase/functions/calculator-ai-chat/index.ts`)
   - A try/catch block parsed the message as JSON but then assigned `actualMessage = message` in both branches, making the parse result unused. Removed the dead block and replaced the `actualMessage` variable with `message` directly.

10. **scrive-signing: getDocumentStatus missing status field** (`supabase/functions/scrive-signing/index.ts`)
    - The select query only fetched `scrive_document_id`, but the code compared `signingDocument.status` (always `undefined`) against the Scrive API response, causing an unnecessary database update on every status check. Added `status` to the select.

11. **useLoanCalculator: deleteScenario missing auth guard** (`src/features/calculator/hooks/useLoanCalculator.tsx`)
    - Unlike `saveScenario`, `deleteScenario` did not check `if (!user)` before proceeding. Added the guard.

12. **LanguageContext: Old brand emails** (`src/contexts/LanguageContext.tsx`)
    - Norwegian and English translations still referenced `kontakt@aproposbolig.no` / `contact@aproposbolig.no` (old brand). Updated both to `kontakt@leily.no`.

13. **LanguageContext: Language preference not persisted** (`src/contexts/LanguageContext.tsx`)
    - Language reset to Norwegian on every page reload. Now persists to `localStorage` under `'leily-language'`.

14. **FeedbackDialog: Submission was faked** (`src/shared/components/FeedbackDialog.tsx`)
    - The feedback form only `console.log`'d the data and used a `setTimeout` to simulate success. Replaced with an actual call to the `send-leily-email` edge function.
    - Added email format validation before submission.

15. **tenantSecurity: Dead code and type fixes** (`src/shared/lib/tenantSecurity.ts`)
    - Removed `getRateLimitHook` — a broken dynamic import of a React hook that would throw "Invalid hook call" if ever invoked from this non-component module.
    - Fixed `MaskedTenantData` interface to allow `null` for masked fields (`email_masked`, `phone_masked`, `national_id_masked`, `emergency_phone_masked`), matching actual runtime values.

---

## Issues Identified (Not Fixed — Require Further Discussion)

### Security (High Priority)

- **Unauthenticated edge functions**: `get-mapbox-token`, `estimate-rent`, `estimate-electricity`, `geocode-address`, and `market-analysis` have no auth checks. Any external party can call them. The Mapbox token endpoint is especially risky as it exposes an API key.
- **CORS `Access-Control-Allow-Origin: '*'`** on all edge functions. Should be restricted to production domain(s).
- **scrive-signing `sendScriveDocument`** does not verify the caller owns the document — any authenticated user could trigger sending of another user's document.
- **finn-property-scraper** deducts credits before scraping succeeds. If scraping fails, the user loses a credit for nothing. Credit deduction should happen after successful extraction.

### Code Quality (Medium Priority)

- **useInputValidation.tsx**: Double-escaped regex characters in template literals (e.g., `\\w` in a RegExp literal becomes a literal backslash + `w`). Norwegian national ID checksum validation also has a logic error rejecting valid IDs with check digit 0.
- **useEmailService.tsx**: Creates a new `createClient()` on every `sendEmail` call instead of using the shared singleton. Only the first recipient in the `to[]` array is sent.
- **usePropertyData.tsx**: Geocode cache is per-component-instance (should be module-level). All geocoding requests fire simultaneously despite a per-call `setTimeout(200)` that provides no actual rate limiting.
- **useOptimizedPropertyData.tsx**: `lastFetchTime` stored in `useState` creates a subtle infinite re-render risk — should be `useRef`.
- **agent-007 edge function**: N+1 query pattern — up to 80+ sequential DB round-trips per request for a user with multiple properties and leases.
- **rate-limiter edge function**: Race condition between SELECT and INSERT allows concurrent requests to bypass rate limiting. Should use `upsert` with `ON CONFLICT`.
- **Rental.tsx**: Hard-coded email (`anderslundoy@leily.no`) for access control — should be a DB role/flag.

### Dependencies

Several packages have major version updates available. These require careful migration planning:

| Package | Current (wanted) | Latest | Notes |
|---|---|---|---|
| react / react-dom | ^18.3.1 | 19.x | Major — breaking changes in concurrent mode |
| react-router-dom | ^6.30.1 | 7.x | Major — new API surface |
| @hookform/resolvers | ^3.10.0 | 5.x | Major |
| zod | ^3.25.76 | 4.x | Major |
| lucide-react | ^0.462.0 | 1.x | Major |
| recharts | ^2.15.4 | 3.x | Major |
| @vercel/analytics | ^1.5.0 | 2.x | Major |
| tailwind-merge | ^2.6.0 | 3.x | Major |

Minor/patch updates within semver range (e.g., Radix UI, Supabase JS, TanStack Query) can be applied with `npm update`.
