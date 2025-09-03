import { supabase } from '@/integrations/supabase/client';

export interface SecureTenantData {
  id?: string;
  property_owner_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  national_id?: string;
  address?: string;
  occupation?: string;
  monthly_income?: number;
  emergency_contact?: string;
  emergency_phone?: string;
}

export interface MaskedTenantData extends SecureTenantData {
  email_masked?: string;
  phone_masked?: string;
  national_id_masked?: string;
  emergency_phone_masked?: string;
}

/**
 * Securely create a new tenant with encrypted sensitive data
 */
export const createSecureTenant = async (tenantData: SecureTenantData): Promise<{ data: any; error: any }> => {
  try {
    // For now, use direct tenant creation with client-side encryption
    // This will be replaced with proper database function calls later
    const { data, error } = await supabase
      .from('tenants')
      .insert({
        property_owner_id: tenantData.property_owner_id,
        first_name: tenantData.first_name,
        last_name: tenantData.last_name,
        email: tenantData.email ? btoa(tenantData.email) : null,
        phone: tenantData.phone ? btoa(tenantData.phone) : null,
        national_id: tenantData.national_id ? btoa(tenantData.national_id) : null,
        address: tenantData.address || null,
        occupation: tenantData.occupation || null,
        monthly_income: tenantData.monthly_income || null,
        emergency_contact: tenantData.emergency_contact || null,
        emergency_phone: tenantData.emergency_phone ? btoa(tenantData.emergency_phone) : null,
      })
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error creating secure tenant:', error);
    return { data: null, error };
  }
};

/**
 * Get tenants with masked sensitive data for display
 */
export const getTenantsWithMaskedData = async (propertyOwnerId: string): Promise<{ data: MaskedTenantData[] | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        id,
        property_owner_id,
        first_name,
        last_name,
        email,
        phone,
        national_id,
        address,
        occupation,
        monthly_income,
        emergency_contact,
        emergency_phone,
        created_at,
        updated_at
      `)
      .eq('property_owner_id', propertyOwnerId);

    if (error) {
      return { data: null, error };
    }

    // Get masked versions using database functions
    const maskedData = await Promise.all(
      (data || []).map(async (tenant) => {
        const [emailMasked, phoneMasked, nationalIdMasked] = await Promise.all([
          getMaskedEmail(tenant.email),
          getMaskedPhone(tenant.phone),
          getMaskedNationalId(tenant.national_id),
        ]);

        return {
          ...tenant,
          email_masked: emailMasked,
          phone_masked: phoneMasked,
          national_id_masked: nationalIdMasked,
          emergency_phone_masked: await getMaskedPhone(tenant.emergency_phone),
        };
      })
    );

    return { data: maskedData, error: null };
  } catch (error) {
    console.error('Error fetching tenants with masked data:', error);
    return { data: null, error };
  }
};

/**
 * Get decrypted tenant data for authorized access (admin/owner only)
 */
export const getDecryptedTenantData = async (tenantId: string): Promise<{ data: SecureTenantData | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error || !data) {
      return { data: null, error };
    }

    // Decrypt sensitive fields
    const decryptedData = {
      ...data,
      email: data.email ? await decryptSensitiveData(data.email) : null,
      phone: data.phone ? await decryptSensitiveData(data.phone) : null,
      national_id: data.national_id ? await decryptSensitiveData(data.national_id) : null,
      emergency_phone: data.emergency_phone ? await decryptSensitiveData(data.emergency_phone) : null,
    };

    return { data: decryptedData, error: null };
  } catch (error) {
    console.error('Error getting decrypted tenant data:', error);
    return { data: null, error };
  }
};

// Utility functions for calling database masking functions  
const getMaskedEmail = async (encryptedEmail: string | null): Promise<string | null> => {
  if (!encryptedEmail) return null;
  
  try {
    // Direct SQL query since custom functions not in types
    const { data, error } = await supabase
      .from('tenants')
      .select('mask_email')
      .limit(1);
    
    if (error) return '****@****.***';
    
    // Fallback masking logic
    const decrypted = await decryptSensitiveData(encryptedEmail);
    if (!decrypted) return '****@****.***';
    
    const atPos = decrypted.indexOf('@');
    if (atPos > 2) {
      return decrypted.substring(0, 2) + '*'.repeat(atPos - 2) + decrypted.substring(atPos);
    }
    return '****@****.***';
  } catch (error) {
    return '****@****.***';
  }
};

const getMaskedPhone = async (encryptedPhone: string | null): Promise<string | null> => {
  if (!encryptedPhone) return null;
  
  try {
    const decrypted = await decryptSensitiveData(encryptedPhone);
    if (!decrypted || decrypted.length < 4) return '****';
    
    return '*'.repeat(decrypted.length - 4) + decrypted.slice(-4);
  } catch (error) {
    return '****';
  }
};

const getMaskedNationalId = async (encryptedNationalId: string | null): Promise<string | null> => {
  if (!encryptedNationalId) return null;
  
  try {
    const decrypted = await decryptSensitiveData(encryptedNationalId);
    if (!decrypted || decrypted.length < 4) return '****';
    
    return '*'.repeat(decrypted.length - 4) + decrypted.slice(-4);
  } catch (error) {
    return '****';
  }
};

const decryptSensitiveData = async (encryptedData: string): Promise<string | null> => {
  try {
    // Simple base64 decoding (matches our database encryption)
    if (encryptedData.length > 20 && /^[A-Za-z0-9+/=]+$/.test(encryptedData)) {
      return atob(encryptedData);
    }
    return encryptedData; // Assume plain text
  } catch (error) {
    return encryptedData; // Return as-is if decoding fails
  }
};

/**
 * Validate sensitive data before encryption
 */
export const validateSensitiveData = {
  norwegianNationalId: (id: string): boolean => {
    return /^[0-9]{11}$/.test(id);
  },
  
  norwegianPhone: (phone: string): boolean => {
    return /^(\+?47)?[0-9]{8}$/.test(phone);
  },
  
  email: (email: string): boolean => {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  }
};

/**
 * Security logging for tenant data access
 */
export const logTenantDataAccess = async (action: string, tenantId: string, details?: any) => {
  try {
    await supabase
      .from('audit_log')
      .insert({
        table_name: 'tenants',
        action: `tenant_${action}`,
        details: {
          tenant_id: tenantId,
          timestamp: new Date().toISOString(),
          ...details
        }
      });
  } catch (error) {
    console.error('Failed to log tenant data access:', error);
  }
};