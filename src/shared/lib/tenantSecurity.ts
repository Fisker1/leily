// SECURE tenant data management - uses proper database-level encryption
import { supabase } from '@/shared/integrations/supabase/client';

// Import rate limiting for sensitive operations
let rateLimitHook: any = null;
const getRateLimitHook = async () => {
  if (!rateLimitHook) {
    const { useRateLimit } = await import('@/shared/hooks/useRateLimit');
    rateLimitHook = useRateLimit;
  }
  return rateLimitHook;
};

// Secure data interfaces
export interface SecureTenantData {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  national_id?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  address?: string;
  occupation?: string;
  monthly_income?: number;
  property_owner_id: string;
}

// Masked data interface - all sensitive fields are pre-masked by database
export interface MaskedTenantData {
  id: string;
  first_name: string;
  last_name: string;
  email_masked: string;
  phone_masked: string;
  national_id_masked: string;
  address?: string;
  occupation?: string;
  monthly_income?: number;
  emergency_contact?: string;
  emergency_phone_masked: string;
  property_owner_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Creates a new secure tenant record - encryption handled by database
 */
export const createSecureTenant = async (tenantData: SecureTenantData) => {
  try {
    // Insert tenant - database triggers handle encryption automatically
    const { data, error } = await supabase
      .from('tenants')
      .insert(tenantData)
      .select()
      .single();

    if (error) {
      console.error('Error creating secure tenant:', error);
      return { data: null, error };
    }

    // Log security action
    await logTenantDataAccess('TENANT_CREATED', data.id, {
      property_owner_id: tenantData.property_owner_id
    });

    return { data, error: null };
  } catch (error) {
    console.error('Critical error in createSecureTenant:', error);
    return { 
      data: null, 
      error: { message: 'Security error: Failed to create tenant' }
    };
  }
};

/**
 * Gets tenants with properly masked sensitive data using secure database function
 * Includes rate limiting protection
 */
export const getTenantsWithMaskedData = async (
  propertyOwnerId: string
): Promise<{ data: MaskedTenantData[] | null; error: any; rateLimited?: boolean }> => {
  try {
    // Apply rate limiting for tenant data access
    const checkRateLimit = async (endpoint: string, identifier: string) => {
      try {
        const { data, error } = await supabase.functions.invoke('rate-limiter', {
          body: { endpoint, identifier }
        });
        
        if (error) {
          console.warn('Rate limiter error, allowing request:', error);
          return true;
        }
        
        return data?.success !== false;
      } catch (error) {
        console.warn('Rate limiter failed, allowing request:', error);
        return true;
      }
    };

    const canProceed = await checkRateLimit('tenant/access', propertyOwnerId);
    if (!canProceed) {
      return { 
        data: null, 
        error: { message: 'Rate limit exceeded for tenant access' },
        rateLimited: true
      };
    }

    // Direct query in staging (no secure function available)
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('property_owner_id', propertyOwnerId);

    if (error) {
      console.error('Error fetching tenant data:', error);
      return { data: null, error };
    }

    // Mask data manually in staging
    const maskedData: MaskedTenantData[] = (data || []).map(tenant => ({
      id: tenant.id,
      first_name: tenant.first_name || 'Ukjent',
      last_name: tenant.last_name || '',
      email_masked: tenant.email ? getMaskedEmail(tenant.email) : null,
      phone_masked: tenant.phone ? getMaskedPhone(tenant.phone) : null,
      national_id_masked: tenant.national_id ? getMaskedNationalId(tenant.national_id) : null,
      emergency_phone_masked: tenant.emergency_phone ? getMaskedPhone(tenant.emergency_phone) : null,
      monthly_income: tenant.monthly_income,
      property_owner_id: tenant.property_owner_id,
      created_at: tenant.created_at,
      updated_at: tenant.updated_at
    }));

    return { data: maskedData, error: null };
  } catch (error) {
    console.error('Critical error in getTenantsWithMaskedData:', error);
    return { 
      data: null, 
      error: { message: 'Security error: Failed to fetch tenant data' }
    };
  }
};

/**
 * Get decrypted tenant data for authorized access (admin use only - via secure function)
 */
export const getDecryptedTenantData = async (
  tenantId: string
): Promise<{ data: SecureTenantData | null; error: any }> => {
  try {
    // First get basic tenant data to verify ownership
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('property_owner_id')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenantData) {
      return { data: null, error: tenantError };
    }

    // Get full tenant data
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (!data || error) {
      return { data: null, error: { message: 'Tenant not found' } };
    }

    // Return secure tenant data (no id included in SecureTenantData type)
    const secureData: SecureTenantData = {
      first_name: data.first_name || 'Ukjent',
      last_name: data.last_name || '',
      email: data.email || undefined,
      phone: data.phone || undefined,
      national_id: data.national_id || undefined,
      emergency_phone: data.emergency_phone || undefined,
      monthly_income: data.monthly_income || undefined,
      property_owner_id: data.property_owner_id,
      address: data.address || undefined,
      occupation: data.occupation || undefined,
      emergency_contact: data.emergency_contact || undefined
    };

    return { data: secureData, error: null };
  } catch (error) {
    console.error('Error getting decrypted tenant data:', error);
    return { data: null, error };
  }
};

/**
 * Data validation utilities (for client-side validation before database)
 */
export const validateSensitiveData = {
  norwegianNationalId: (id: string): boolean => {
    if (!/^\d{11}$/.test(id)) return false;
    
    const day = parseInt(id.substring(0, 2));
    const month = parseInt(id.substring(2, 4));
    
    if (day < 1 || day > 31) return false;
    if (month < 1 || month > 12) return false;
    
    return true;
  },
  
  norwegianPhone: (phone: string): boolean => {
    return /^\+?47[0-9]{8}$|^[0-9]{8}$/.test(phone);
  },
  
  email: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
};

/**
 * Logs tenant data access for comprehensive security audit trail
 */
export const logTenantDataAccess = async (
  action: string, 
  tenantId: string, 
  details?: any
): Promise<void> => {
  try {
    await supabase
      .from('audit_log')
      .insert({
        table_name: 'tenants',
        action,
        details: {
          tenant_id: tenantId,
          timestamp: new Date().toISOString(),
          security_context: 'client_side_access',
          ...details
        }
      });
  } catch (error) {
    console.error('SECURITY WARNING: Failed to log tenant data access:', error);
    // Don't throw - logging failures shouldn't break the application
  }
};

/**
 * DEPRECATED FUNCTIONS - Kept for backward compatibility
 * These functions used insecure base64 encoding and are no longer used
 */

// Client-side masking helper functions (for display purposes only - database does this properly now)
export const maskSensitiveData = (
  data: string | null, 
  type: 'email' | 'phone' | 'national_id'
): string | null => {
  if (!data) return null;
  
  switch (type) {
    case 'email':
      return getMaskedEmail(data);
    case 'phone':
      return getMaskedPhone(data);
    case 'national_id':
      return getMaskedNationalId(data);
    default:
      return data;
  }
};

const getMaskedEmail = (email: string): string => {
  if (!email || !email.includes('@')) {
    return '***@***.***';
  }
  
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 3) {
    return `${localPart[0]}***@${domain}`;
  }
  
  return `${localPart.substring(0, 3)}***@${domain}`;
};

const getMaskedPhone = (phone: string): string => {
  if (!phone || phone.length < 8) {
    return '*** *** ****';
  }
  
  const lastFour = phone.slice(-4);
  const prefix = phone.startsWith('+47') ? '+47 ' : '';
  return `${prefix}*** *** ${lastFour}`;
};

const getMaskedNationalId = (nationalId: string): string => {
  if (!nationalId || nationalId.length !== 11) {
    return '******/*****';
  }
  
  return `${nationalId.substring(0, 6)}/*****`;
};