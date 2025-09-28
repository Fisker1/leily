# `useRateLimit` (`src/hooks/useRateLimit.tsx`)

Client helper to check server-side rate limits via Supabase function `rate-limiter`.

## Return value

```ts
{
  checkRateLimit: (endpoint: string, identifier?: string) => Promise<boolean>,
  isChecking: boolean
}
```

- `checkRateLimit(endpoint, identifier?)`
  - Returns `true` if request may proceed, `false` if limited.
  - Shows toast warnings when near limit and errors when exceeded.

## Example

```ts
const { checkRateLimit } = useRateLimit();

async function onSensitiveAction() {
  if (!(await checkRateLimit('tenant/access', user.id))) return;
  // proceed with action
}
```