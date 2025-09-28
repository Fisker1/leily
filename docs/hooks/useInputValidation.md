# `useInputValidation` (`src/hooks/useInputValidation.tsx`)

Comprehensive input sanitization and validation helpers with XSS protection.

## Return value

```ts
{
  sanitizeInput,
  validateEmail,
  validatePhone,
  validateName,
  validateNationalId,
  validateAmount,
  validateUrl,
  validateText
}
```

Each validator returns:
```ts
{ isValid: boolean, errors: string[], sanitizedValue: string }
```

## Example

```ts
const { validateEmail, validateNationalId } = useInputValidation();

const email = validateEmail(' User@Example.com ');
if (!email.isValid) console.log(email.errors);

const fnr = validateNationalId('12051212345');
```