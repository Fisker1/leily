import { useCallback } from 'react';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue: string;
}

export const useInputValidation = () => {
  
  // Comprehensive input sanitization
  const sanitizeInput = useCallback((
    input: string, 
    type: 'text' | 'email' | 'phone' | 'url' | 'number' | 'name' = 'text'
  ): string => {
    if (!input) return '';

    let sanitized = input.trim();

    switch (type) {
      case 'email':
        sanitized = sanitized.toLowerCase().replace(/[^\\w@.-]/g, '');
        break;
      case 'phone':
        sanitized = sanitized.replace(/[^\\d\\s+()-]/g, '');
        break;
      case 'url':
        sanitized = encodeURI(sanitized);
        break;
      case 'number':
        sanitized = sanitized.replace(/[^\\d.-]/g, '');
        break;
      case 'name':
        // Allow letters, spaces, hyphens, apostrophes
        sanitized = sanitized.replace(/[^a-zA-ZæøåÆØÅ\\s'-]/g, '');
        break;
      case 'text':
      default:
        // Remove potentially dangerous characters but keep Norwegian characters
        sanitized = sanitized.replace(/[<>'"&]/g, '');
        break;
    }

    return sanitized;
  }, []);

  // Email validation
  const validateEmail = useCallback((email: string): ValidationResult => {
    const sanitized = sanitizeInput(email, 'email');
    const errors: string[] = [];
    
    if (!sanitized) {
      errors.push('E-post er påkrevd');
    } else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(sanitized)) {
      errors.push('Ugyldig e-post format');
    } else if (sanitized.length > 254) {
      errors.push('E-post er for lang');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  }, [sanitizeInput]);

  // Phone validation (Norwegian format)
  const validatePhone = useCallback((phone: string): ValidationResult => {
    const sanitized = sanitizeInput(phone, 'phone');
    const errors: string[] = [];
    
    if (!sanitized) {
      errors.push('Telefonnummer er påkrevd');
    } else if (!/^(\+47)?[0-9]{8}$/.test(sanitized.replace(/\s/g, ''))) {
      errors.push('Ugyldig norsk telefonnummer format');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  }, [sanitizeInput]);

  // Name validation
  const validateName = useCallback((name: string): ValidationResult => {
    const sanitized = sanitizeInput(name, 'name');
    const errors: string[] = [];
    
    if (!sanitized) {
      errors.push('Navn er påkrevd');
    } else if (sanitized.length < 2) {
      errors.push('Navn må være minst 2 tegn');
    } else if (sanitized.length > 100) {
      errors.push('Navn er for langt');
    } else if (!/^[a-zA-ZæøåÆØÅ\s'-]+$/.test(sanitized)) {
      errors.push('Navn kan kun inneholde bokstaver, mellomrom, bindestrek og apostrof');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  }, [sanitizeInput]);

  // Norwegian national ID validation
  const validateNationalId = useCallback((nationalId: string): ValidationResult => {
    const sanitized = sanitizeInput(nationalId, 'number');
    const errors: string[] = [];
    
    if (!sanitized) {
      errors.push('Fødselsnummer er påkrevd');
    } else if (!/^[0-9]{11}$/.test(sanitized)) {
      errors.push('Fødselsnummer må være 11 siffer');
    } else {
      // Basic Norwegian national ID checksum validation
      const digits = sanitized.split('').map(Number);
      const weights1 = [3, 7, 6, 1, 8, 9, 4, 5, 2];
      const weights2 = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
      
      let sum1 = 0;
      let sum2 = 0;
      
      for (let i = 0; i < 9; i++) {
        sum1 += digits[i] * weights1[i];
      }
      for (let i = 0; i < 10; i++) {
        sum2 += digits[i] * weights2[i];
      }
      
      const checksum1 = 11 - (sum1 % 11);
      const checksum2 = 11 - (sum2 % 11);
      
      if (checksum1 !== digits[9] || checksum2 !== digits[10]) {
        errors.push('Ugyldig fødselsnummer');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  }, [sanitizeInput]);

  // Currency amount validation
  const validateAmount = useCallback((amount: string): ValidationResult => {
    const sanitized = sanitizeInput(amount, 'number');
    const errors: string[] = [];
    const numericValue = parseFloat(sanitized);
    
    if (!sanitized) {
      errors.push('Beløp er påkrevd');
    } else if (isNaN(numericValue)) {
      errors.push('Ugyldig beløp format');
    } else if (numericValue < 0) {
      errors.push('Beløp kan ikke være negativt');
    } else if (numericValue > 999999999) {
      errors.push('Beløp er for høyt');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  }, [sanitizeInput]);

  // URL validation
  const validateUrl = useCallback((url: string): ValidationResult => {
    const sanitized = sanitizeInput(url, 'url');
    const errors: string[] = [];
    
    if (sanitized) {
      try {
        new URL(sanitized);
      } catch {
        errors.push('Ugyldig URL format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  }, [sanitizeInput]);

  // Generic text validation with XSS protection
  const validateText = useCallback((
    text: string, 
    minLength: number = 0, 
    maxLength: number = 1000
  ): ValidationResult => {
    const sanitized = sanitizeInput(text, 'text');
    const errors: string[] = [];
    
    if (minLength > 0 && (!sanitized || sanitized.length < minLength)) {
      errors.push(`Tekst må være minst ${minLength} tegn`);
    }
    if (sanitized && sanitized.length > maxLength) {
      errors.push(`Tekst kan ikke være lengre enn ${maxLength} tegn`);
    }
    
    // Check for potential XSS patterns
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ];
    
    if (xssPatterns.some(pattern => pattern.test(text))) {
      errors.push('Tekst inneholder forbudte elementer');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  }, [sanitizeInput]);

  return {
    sanitizeInput,
    validateEmail,
    validatePhone,
    validateName,
    validateNationalId,
    validateAmount,
    validateUrl,
    validateText
  };
};
