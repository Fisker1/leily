import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, User, Home, FileText, Phone, Mail, IdCard, Plus, Building, CreditCard, Camera } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/shared/lib/utils";
import { useToast } from "@/shared/hooks/use-toast";
import { supabase } from '@/shared/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { createSecureTenant, SecureTenantData, logTenantDataAccess } from '@/shared/lib/tenantSecurity';
// import { LeaseSigningDialog } from './signing/LeaseSigningDialog';

interface RentalAgreementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: Array<{ id: string; address: string; city?: string; size_sqm?: number; [key: string]: unknown }>;
  onPropertyAdded?: () => void;
}

interface TenantData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalId: string;
  address: string;
  occupation: string;
  monthlyIncome: string;
  emergencyContact: string;
  emergencyPhone: string;
}

interface LeaseData {
  propertyId: string;
  monthlyRent: string;
  depositAmount: string;
  startDate: Date | null;
  endDate: Date | null;
  leaseTerms: string;
  utilitiesIncluded: boolean;
  parkingIncluded: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  createDepositAccount: boolean;
  bankName: string;
}

const RentalAgreementDialog = ({ open, onOpenChange, properties, onPropertyAdded }: RentalAgreementDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [createdLeaseId, setCreatedLeaseId] = useState<string | null>(null);
  const [showSigningDialog, setShowSigningDialog] = useState(false);
  const [propertyFormData, setPropertyFormData] = useState({
    address: "",
    city: "",
    postal_code: "",
    property_type: "",
    size_sqm: "",
    bedrooms: "",
  });

  const [tenantData, setTenantData] = useState<TenantData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationalId: '',
    address: '',
    occupation: '',
    monthlyIncome: '',
    emergencyContact: '',
    emergencyPhone: ''
  });

  const [leaseData, setLeaseData] = useState<LeaseData>({
    propertyId: '',
    monthlyRent: '',
    depositAmount: '',
    startDate: null,
    endDate: null,
    leaseTerms: '',
    utilitiesIncluded: false,
    parkingIncluded: false,
    petsAllowed: false,
    smokingAllowed: false,
    createDepositAccount: false,
    bankName: 'Instabank'
  });

  const handleTenantDataChange = (field: keyof TenantData, value: string) => {
    setTenantData(prev => ({ ...prev, [field]: value }));
  };

  const handleLeaseDataChange = (field: keyof LeaseData, value: string | number | boolean | Date) => {
    setLeaseData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    const required = ['firstName', 'lastName', 'email', 'phone', 'nationalId'];
    const hasRequiredFields = required.every(field => tenantData[field as keyof TenantData].trim() !== '');
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(tenantData.email.trim());
    
    return hasRequiredFields && isValidEmail;
  };

  const validateStep2 = () => {
    return leaseData.propertyId && leaseData.monthlyRent && leaseData.startDate;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleCreateProperty = async () => {
    if (!propertyFormData.address || !propertyFormData.city) {
      toast({
        title: "Manglende informasjon",
        description: "Vennligst fyll ut adresse og by",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data: newProperty, error: propertyError } = await supabase
        .from('properties')
        .insert([{
          address: propertyFormData.address,
          city: propertyFormData.city,
          postal_code: propertyFormData.postal_code,
          property_type: propertyFormData.property_type,
          size_sqm: propertyFormData.size_sqm ? parseInt(propertyFormData.size_sqm) : null,
          bedrooms: propertyFormData.bedrooms ? parseInt(propertyFormData.bedrooms) : null,
          show_in_rental: true,
          owner_id: user.id
        }])
        .select()
        .single();

      if (propertyError) throw propertyError;

      // Update the lease data with the new property ID
      handleLeaseDataChange('propertyId', newProperty.id);

      // Reset property form and hide it
      setPropertyFormData({
        address: "",
        city: "",
        postal_code: "",
        property_type: "",
        size_sqm: "",
        bedrooms: "",
      });
      setShowPropertyForm(false);

      toast({
        title: "Eiendom opprettet",
        description: "Ny eiendom er lagt til og valgt for leieavtalen",
      });

      // Refresh properties list in parent component
      if (onPropertyAdded) {
        onPropertyAdded();
      }
      
    } catch (error) {
      console.error('Error creating property:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke opprette eiendom",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    console.log('Starting rental agreement submission...');
    console.log('Tenant data:', tenantData);
    console.log('Lease data:', leaseData);
    
    if (!validateStep1() || !validateStep2()) {
      toast({
        title: "Manglende informasjon",
        description: "Vennligst fyll ut alle påkrevde felt",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      // First, create the tenant using secure function
      console.log('Creating tenant securely...');
      const secureTenantData: SecureTenantData = {
        property_owner_id: user.id,
        first_name: tenantData.firstName,
        last_name: tenantData.lastName,
        email: tenantData.email || undefined,
        phone: tenantData.phone || undefined,
        national_id: tenantData.nationalId || undefined,
        address: tenantData.address || undefined,
        occupation: tenantData.occupation || undefined,
        monthly_income: parseInt(tenantData.monthlyIncome) || undefined,
        emergency_contact: tenantData.emergencyContact || undefined,
        emergency_phone: tenantData.emergencyPhone || undefined,
      };

      const { data: tenant, error: tenantError } = await createSecureTenant(secureTenantData);

      if (tenantError) {
        console.error('Secure tenant creation error:', tenantError);
        throw tenantError;
      }
      console.log('Tenant created securely:', tenant);

      // Log the secure tenant creation
      await logTenantDataAccess('created', tenant.id, {
        property_id: leaseData.propertyId,
        encrypted_fields: ['email', 'phone', 'national_id', 'emergency_phone']
      });

      // Then, create the lease agreement
      console.log('Creating lease agreement...');
      const { data: lease, error: leaseError } = await supabase
        .from('lease_agreements')
        .insert([{
          property_id: leaseData.propertyId,
          tenant_id: tenant.id,
          monthly_rent: parseFloat(leaseData.monthlyRent),
          deposit_amount: parseFloat(leaseData.depositAmount) || null,
          start_date: leaseData.startDate?.toISOString(),
          end_date: leaseData.endDate?.toISOString(),
          lease_terms: leaseData.leaseTerms,
          status: 'active',
          utilities_included: leaseData.utilitiesIncluded,
          parking_included: leaseData.parkingIncluded,
          pets_allowed: leaseData.petsAllowed,
          smoking_allowed: leaseData.smokingAllowed,
          property_owner_id: user.id
        }])
        .select()
        .single();

      if (leaseError) {
        console.error('Lease agreement creation error:', leaseError);
        throw leaseError;
      }
      console.log('Lease agreement created successfully:', lease);

      // Create deposit account if requested
      if (leaseData.createDepositAccount && leaseData.depositAmount && parseFloat(leaseData.depositAmount) > 0) {
        console.log('Creating deposit account...');
        const { data: depositAccount, error: depositError } = await supabase
          .from('deposit_accounts')
          .insert([{
            lease_id: lease.id,
            property_owner_id: user.id,
            deposit_amount: parseFloat(leaseData.depositAmount),
            interest_rate: 2.5, // Default Instabank rate
            bank_name: leaseData.bankName,
            status: 'active'
          }])
          .select()
          .single();

        if (depositError) {
          console.error('Deposit account creation error:', depositError);
          // Don't throw error - lease is still created
          toast({
            title: "Advarsel",
            description: "Leieavtale opprettet, men depositumskonto kunne ikke opprettes automatisk",
            variant: "destructive",
          });
        } else {
          console.log('Deposit account created successfully:', depositAccount);
        }
      }

      toast({
        title: "Leieavtale opprettet",
        description: `Leieavtale for ${tenantData.firstName} ${tenantData.lastName} er opprettet`,
      });

      // Store lease ID and move to step 4 for signing
      setCreatedLeaseId(lease.id);
      setStep(4);

    } catch (error) {
      console.error('Error creating rental agreement:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke opprette leieavtale. Prøv igjen.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendToSigning = async () => {
    if (!createdLeaseId) {
      toast({
        title: "Feil",
        description: "Ingen leieavtale å sende til signering",
        variant: "destructive",
      });
      return;
    }

    // Open signing dialog instead of calling API directly
    setShowSigningDialog(true);
  };

  const selectedProperty = properties.find(p => p.id === leaseData.propertyId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Opprett ny leieavtale
          </DialogTitle>
          <DialogDescription>
            Registrer ny leietaker og opprett leieavtale. Steg {step} av 4.
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
              1
            </div>
            <div className={`h-0.5 w-16 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
              2
            </div>
            <div className={`h-0.5 w-16 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
              3
            </div>
          </div>
        </div>

        {/* Step 1: Tenant Information */}
        {step === 1 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Leietaker informasjon
                </CardTitle>
                <CardDescription>
                  Grunnleggende informasjon om den nye leietakeren
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Fornavn *</Label>
                    <Input
                      id="firstName"
                      value={tenantData.firstName}
                      onChange={(e) => handleTenantDataChange('firstName', e.target.value)}
                      placeholder="Ola"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Etternavn *</Label>
                    <Input
                      id="lastName"
                      value={tenantData.lastName}
                      onChange={(e) => handleTenantDataChange('lastName', e.target.value)}
                      placeholder="Nordmann"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-post *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={tenantData.email}
                      onChange={(e) => handleTenantDataChange('email', e.target.value)}
                      placeholder="ola@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefon *</Label>
                    <Input
                      id="phone"
                      value={tenantData.phone}
                      onChange={(e) => handleTenantDataChange('phone', e.target.value)}
                      placeholder="+47 123 45 678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nationalId">Fødselsnummer *</Label>
                    <Input
                      id="nationalId"
                      value={tenantData.nationalId}
                      onChange={(e) => handleTenantDataChange('nationalId', e.target.value)}
                      placeholder="12345678901"
                    />
                  </div>
                  <div>
                    <Label htmlFor="occupation">Yrke</Label>
                    <Input
                      id="occupation"
                      value={tenantData.occupation}
                      onChange={(e) => handleTenantDataChange('occupation', e.target.value)}
                      placeholder="Ingeniør"
                    />
                  </div>
                  <div>
                    <Label htmlFor="monthlyIncome">Månedsinntekt (kr)</Label>
                    <Input
                      id="monthlyIncome"
                      type="number"
                      value={tenantData.monthlyIncome}
                      onChange={(e) => handleTenantDataChange('monthlyIncome', e.target.value)}
                      placeholder="50000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Adresse</Label>
                    <Input
                      id="address"
                      value={tenantData.address}
                      onChange={(e) => handleTenantDataChange('address', e.target.value)}
                      placeholder="Storgata 1, 0001 Oslo"
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyContact">Nærmeste pårørende</Label>
                    <Input
                      id="emergencyContact"
                      value={tenantData.emergencyContact}
                      onChange={(e) => handleTenantDataChange('emergencyContact', e.target.value)}
                      placeholder="Kari Nordmann"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyPhone">Telefon pårørende</Label>
                    <Input
                      id="emergencyPhone"
                      value={tenantData.emergencyPhone}
                      onChange={(e) => handleTenantDataChange('emergencyPhone', e.target.value)}
                      placeholder="+47 987 65 432"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Lease Details */}
        {step === 2 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Leieavtale detaljer
                </CardTitle>
                <CardDescription>
                  Informasjon om leieforholdet og eiendommen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Velg eiendom *</Label>
                  <Select value={leaseData.propertyId} onValueChange={(value) => {
                    if (value === "create-new") {
                      setShowPropertyForm(true);
                    } else {
                      handleLeaseDataChange('propertyId', value);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg eiendom" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.filter(p => p.id !== 'example').map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.address}, {String(property.city || '')} ({String(property.size_sqm || '')}m²)
                        </SelectItem>
                      ))}
                      <SelectItem value="create-new">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Opprett ny eiendom
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {showPropertyForm && (
                  <Card className="border-dashed">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Plus className="h-5 w-5" />
                        Opprett ny eiendom
                      </CardTitle>
                      <CardDescription>
                        Fyll ut grunnleggende informasjon om eiendommen
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="new-address">Adresse *</Label>
                          <Input
                            id="new-address"
                            value={propertyFormData.address}
                            onChange={(e) => setPropertyFormData(prev => ({...prev, address: e.target.value}))}
                            placeholder="f.eks. Storgata 1"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-city">By *</Label>
                          <Input
                            id="new-city"
                            value={propertyFormData.city}
                            onChange={(e) => setPropertyFormData(prev => ({...prev, city: e.target.value}))}
                            placeholder="Oslo"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-postal">Postnummer</Label>
                          <Input
                            id="new-postal"
                            value={propertyFormData.postal_code}
                            onChange={(e) => setPropertyFormData(prev => ({...prev, postal_code: e.target.value}))}
                            placeholder="0123"
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-type">Eiendomstype</Label>
                          <Select value={propertyFormData.property_type} onValueChange={(value) => setPropertyFormData(prev => ({...prev, property_type: value}))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Velg type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Leilighet">Leilighet</SelectItem>
                              <SelectItem value="Enebolig">Enebolig</SelectItem>
                              <SelectItem value="Rekkehus">Rekkehus</SelectItem>
                              <SelectItem value="Tomannsbolig">Tomannsbolig</SelectItem>
                              <SelectItem value="Hytte">Hytte</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="new-size">Størrelse (m²)</Label>
                          <Input
                            id="new-size"
                            type="number"
                            value={propertyFormData.size_sqm}
                            onChange={(e) => setPropertyFormData(prev => ({...prev, size_sqm: e.target.value}))}
                            placeholder="85"
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-bedrooms">Soverom</Label>
                          <Input
                            id="new-bedrooms"
                            type="number"
                            value={propertyFormData.bedrooms}
                            onChange={(e) => setPropertyFormData(prev => ({...prev, bedrooms: e.target.value}))}
                            placeholder="3"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          onClick={handleCreateProperty}
                          disabled={loading}
                          size="sm"
                        >
                          {loading ? "Oppretter..." : "Opprett eiendom"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setShowPropertyForm(false)}
                          size="sm"
                        >
                          Avbryt
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="monthlyRent">Månedlig leie (kr) *</Label>
                    <Input
                      id="monthlyRent"
                      type="number"
                      value={leaseData.monthlyRent}
                      onChange={(e) => handleLeaseDataChange('monthlyRent', e.target.value)}
                      placeholder="25000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="depositAmount">Depositum (kr)</Label>
                    <Input
                      id="depositAmount"
                      type="number"
                      value={leaseData.depositAmount}
                      onChange={(e) => handleLeaseDataChange('depositAmount', e.target.value)}
                      placeholder="75000"
                    />
                  </div>
                </div>

                {/* Deposit Account Creation */}
                {leaseData.depositAmount && parseFloat(leaseData.depositAmount) > 0 && (
                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Depositumskonto
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Opprett sikker depositumskonto gjennom Instabank
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="createDepositAccount"
                          checked={leaseData.createDepositAccount}
                          onCheckedChange={(checked) => handleLeaseDataChange('createDepositAccount', checked)}
                        />
                        <Label htmlFor="createDepositAccount" className="text-sm">
                          Opprett depositumskonto hos {leaseData.bankName}
                        </Label>
                      </div>
                      
                      {leaseData.createDepositAccount && (
                        <div className="bg-white p-3 rounded border space-y-2">
                          <div className="flex items-center gap-2 text-sm text-blue-700">
                            <CreditCard className="h-4 w-4" />
                            <span className="font-medium">Depositum: {parseInt(leaseData.depositAmount).toLocaleString()} kr</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Kontoen opprettes automatisk med høyeste rente og vil være knyttet til denne leieavtalen. 
                            Leietaker får tilgang til kontoinformasjon via e-post.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Startdato *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !leaseData.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {leaseData.startDate ? format(leaseData.startDate, "PPP", { locale: nb }) : "Velg dato"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={leaseData.startDate || undefined}
                          onSelect={(date) => handleLeaseDataChange('startDate', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Sluttdato (valgfri)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !leaseData.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {leaseData.endDate ? format(leaseData.endDate, "PPP", { locale: nb }) : "Velg dato (valgfri)"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={leaseData.endDate || undefined}
                          onSelect={(date) => handleLeaseDataChange('endDate', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div>
                  <Label htmlFor="leaseTerms">Spesielle vilkår</Label>
                  <Textarea
                    id="leaseTerms"
                    value={leaseData.leaseTerms}
                    onChange={(e) => handleLeaseDataChange('leaseTerms', e.target.value)}
                    placeholder="Beskrive eventuelle spesielle vilkår for leieforholdet..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Summary */}
        {step === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sammendrag av leieavtale</CardTitle>
                <CardDescription>
                  Gjennomgå informasjonen før du går videre til signering
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Leietaker
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Navn:</strong> {tenantData.firstName} {tenantData.lastName}</p>
                      <p><strong>E-post:</strong> {tenantData.email}</p>
                      <p><strong>Telefon:</strong> {tenantData.phone}</p>
                      <p><strong>Fødselsnummer:</strong> {tenantData.nationalId}</p>
                      {tenantData.occupation && <p><strong>Yrke:</strong> {tenantData.occupation}</p>}
                      {tenantData.monthlyIncome && <p><strong>Månedsinntekt:</strong> {parseInt(tenantData.monthlyIncome).toLocaleString()} kr</p>}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Eiendom og leieforhold
                    </h4>
                    <div className="space-y-2 text-sm">
                      {selectedProperty && (
                        <>
                          <p><strong>Adresse:</strong> {selectedProperty.address}, {String(selectedProperty.city || '')}</p>
                          <p><strong>Størrelse:</strong> {String(selectedProperty.size_sqm || '')}m²</p>
                        </>
                      )}
                      <p><strong>Månedlig leie:</strong> {parseInt(leaseData.monthlyRent || '0').toLocaleString()} kr</p>
                      {leaseData.depositAmount && <p><strong>Depositum:</strong> {parseInt(leaseData.depositAmount).toLocaleString()} kr</p>}
                      {leaseData.createDepositAccount && leaseData.depositAmount && (
                        <p><strong>Depositumskonto:</strong> Opprettes hos {leaseData.bankName}</p>
                      )}
                      {leaseData.startDate && <p><strong>Startdato:</strong> {format(leaseData.startDate, "PPP", { locale: nb })}</p>}
                      {leaseData.endDate && <p><strong>Sluttdato:</strong> {format(leaseData.endDate, "PPP", { locale: nb })}</p>}
                    </div>
                  </div>
                </div>

                {leaseData.leaseTerms && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Spesielle vilkår:</h4>
                    <p className="text-sm bg-muted p-3 rounded-lg">{leaseData.leaseTerms}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Send to Signing */}
        {step === 4 && createdLeaseId && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Klar for BankID-signering
                </CardTitle>
                <CardDescription>
                  Leieavtalen er opprettet og klar for elektronisk signering
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                        Leieavtale opprettet! 🎉
                      </h4>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        Avtalen er lagret i systemet. Du kan nå sende den til BankID-signering.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Hva skjer nå?</h4>
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      <div>
                        <p className="font-medium">Du signerer først</p>
                        <p className="text-muted-foreground">Du vil bli sendt til BankID for å signere avtalen</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      <div>
                        <p className="font-medium">Leietaker får e-post</p>
                        <p className="text-muted-foreground">{tenantData.firstName} {tenantData.lastName} får automatisk tilsendt signeringslenke</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      <div>
                        <p className="font-medium">Leietaker signerer</p>
                        <p className="text-muted-foreground">Når begge har signert er avtalen juridisk bindende</p>
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Om BankID-signering
                      </p>
                      <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                        <li>• Bruk din vanlige BankID (mobil eller kodebrikke)</li>
                        <li>• Signeringen tar vanligvis under 2 minutter</li>
                        <li>• Avtalen er juridisk bindende når begge har signert</li>
                        <li>• Du får e-post når leietaker har signert</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                Tilbake
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            {step < 3 ? (
              <Button 
                onClick={handleNext} 
                disabled={step === 1 ? !validateStep1() : !validateStep2()}
              >
                Neste
              </Button>
            ) : step === 3 ? (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Oppretter..." : "Opprett leieavtale"}
              </Button>
            ) : (
              <Button onClick={handleSendToSigning} disabled={loading}>
                {loading ? "Sender..." : "Send til BankID-signering"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
      
      {/* Signing Dialog - Component removed */}
      {showSigningDialog && (
        <div className="p-4">
          <p>Signing dialog component has been temporarily removed.</p>
        </div>
      )}
    </Dialog>
  );
};

export default RentalAgreementDialog;