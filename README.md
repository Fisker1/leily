# Leily

Real estate platform for the Norwegian market.

## Stack

React 18 / TypeScript / Vite / Tailwind / shadcn/ui / Supabase / Vercel

## Setup

```bash
npm install
cp .env.example .env   # fill in Supabase credentials
npm run dev             # http://localhost:8080
```

## Environment variables

See `.env.example` for all options. Set in Vercel dashboard for deployments.

## Project structure

```
src/
  features/        Feature modules (pages, components, hooks per domain)
  shared/          Cross-cutting code (hooks, utils, integrations)
  components/ui/   shadcn/ui primitives
  contexts/        React contexts (Auth, Language)
supabase/
  functions/       Edge Functions
  migrations/      Database schema (single baseline)
```

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run lint       # eslint
npm run preview    # preview prod build
```

## Deployment

Push to git. Vercel deploys automatically:
- `stage` -> stage.leily.no
- `main` -> www.leily.no

## Security

- No hardcoded secrets; all credentials from env vars
- `console.*` and `debugger` stripped from production builds
- Supabase RLS enforces data access at database level
- Input sanitized with DOMPurify before rendering
