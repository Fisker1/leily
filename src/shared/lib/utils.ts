import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format numbers with Norwegian thousand separator (space)
export function formatNumberWithSpaces(value: string | number): string {
  if (!value && value !== 0) return "";
  
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numericValue)) return "";
  
  // Use Norwegian locale to format with spaces as thousand separator
  return new Intl.NumberFormat('no-NO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true
  }).format(numericValue);
}

// Remove spaces from formatted number to get clean numeric value
export function parseFormattedNumber(formattedValue: string): string {
  if (!formattedValue) return "";
  // Remove all spaces and return the clean number
  return formattedValue.replace(/\s/g, "");
}
