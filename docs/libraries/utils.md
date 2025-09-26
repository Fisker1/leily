# Utilities (`src/lib/utils.ts`)

Helpers for UI and numeric formatting.

## Public API

- `cn(...inputs: ClassValue[]): string`
  - Merge Tailwind/clsx class names.
  - Example:
    ```ts
    <div className={cn('p-4', isActive && 'bg-green-500')} />
    ```

- `formatNumberWithSpaces(value: string | number): string`
  - Format number with Norwegian thousands separator (space).
  - Example:
    ```ts
    formatNumberWithSpaces(1234567) // "1 234 567"
    ```

- `parseFormattedNumber(formattedValue: string): string`
  - Remove spaces from a formatted number string.
  - Example:
    ```ts
    parseFormattedNumber('1 234 567') // "1234567"
    ```