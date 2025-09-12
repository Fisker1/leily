import React, { useState, useEffect, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { formatNumberWithSpaces, parseFormattedNumber } from "@/lib/utils";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string | number;
  onChange?: (value: string) => void;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, onFocus, onBlur, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    // Update display value when value prop changes
    useEffect(() => {
      if (!isFocused) {
        // When not focused, show formatted value with spaces
        setDisplayValue(formatNumberWithSpaces(value || ""));
      }
    }, [value, isFocused]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Show formatted value for better user experience
      setDisplayValue(formatNumberWithSpaces(value || ""));
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      // Show formatted value with spaces
      setDisplayValue(formatNumberWithSpaces(value || ""));
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Pass clean numeric value to parent
      const cleanValue = parseFormattedNumber(inputValue);
      onChange?.(cleanValue);
      
      // Format display value in real-time while typing
      const formattedValue = formatNumberWithSpaces(cleanValue);
      setDisplayValue(formattedValue);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };