# Tenant Security Helpers (`src/lib/tenantSecurity.ts`)

Secure tenant data management using Supabase and database-level masking/decryption.

## Types

- `SecureTenantData`
- `MaskedTenantData`

## Public API

- `createSecureTenant(tenantData: SecureTenantData)`
  - Inserts tenant; encryption handled by DB triggers.
  - Returns `{ data, error }`.
  - Example:
    ```ts
    const { data, error } = await createSecureTenant({ first_name: 'Ola', last_name: 'Nordmann', property_owner_id: user.id });
    ```

- `getTenantsWithMaskedData(propertyOwnerId: string)`
  - Applies rate limiting, calls `rpc('get_secure_tenant_data')` to fetch masked fields.
  - Returns `{ data: MaskedTenantData[] | null, error, rateLimited? }`.

- `getDecryptedTenantData(tenantId: string)`
  - Admin/authorized path; verifies owner, then uses secure RPC.
  - Returns `{ data: SecureTenantData | null, error }`.

- `validateSensitiveData`
  - `norwegianNationalId(id: string): boolean`
  - `norwegianPhone(phone: string): boolean`
  - `email(email: string): boolean`

- `logTenantDataAccess(action: string, tenantId: string, details?: any): Promise<void>`
  - Inserts audit trail into `audit_log`.

- `maskSensitiveData(data: string | null, type: 'email' | 'phone' | 'national_id')`
  - UI-only masking helper (deprecated for security, but useful for display).