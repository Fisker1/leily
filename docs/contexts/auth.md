# Auth Context (`src/contexts/AuthContext.tsx`)

Provides authenticated user/session/profile and auth actions.

## Public API

- `useAuth()`
  - Returns `{ user, session, profile, loading, signIn, signUp, signOut, signInWithProvider, updateProfile }`.

- `AuthProvider`
  - Context provider component.

## Usage

```tsx
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <MyScreen />
    </AuthProvider>
  );
}

function MyScreen() {
  const { user, signIn, signOut, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? (
    <button onClick={signOut}>Sign out</button>
  ) : (
    <button onClick={() => signIn('user@example.com', 'password')}>Sign in</button>
  );
}
```

## Functions

- `signIn(email, password)`
  - Uses RPC `enhanced_rate_limit_check` and logs security events.
- `signUp(email, password, fullName?)`
  - Validates password strength via RPC, logs audit events.
- `signInWithProvider('google' | 'facebook')`
  - OAuth with environment-aware redirect.
- `updateProfile(updates)`
  - Updates `profiles` row for current user and updates local state.