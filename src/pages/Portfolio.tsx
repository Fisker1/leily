import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import { PropertyAddDialog } from "@/components/PropertyAddDialog";
import { PropertyEditDialog } from "@/components/PropertyEditDialog";
import { PropertyDetailsDialog } from "@/components/PropertyDetailsDialog";
import { PropertyDocumentsDialog } from "@/components/PropertyDocumentsDialog";
import PropertyImage from "@/components/PropertyImage";
import RentalAgreementDialog from "@/components/RentalAgreementDialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getTenantsWithMaskedData, logTenantDataAccess } from "@/lib/tenantSecurity";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Plus,
  FileText,
  PieChart,
  BarChart3,
  Calendar,
  Upload,
  Eye,
  Edit,
  Trash,
  Download
} from "lucide-react";
import Gauge from "@/components/ui/gauge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

interface Property {
  id: string;
  address: string;
  city?: string;
  postal_code?: string;
  property_type?: string;
  size_sqm?: number;
  bedrooms?: number;
  purchase_price?: number;
  purchase_date?: string;
  loan_amount?: number;
  interest_rate?: number;
  loan_duration_years?: number;
  current_value?: number;
  image_url?: string;
  monthly_rent?: number;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
}

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  national_id?: string;
  property_owner_id: string;
  address?: string;
  occupation?: string;
  monthly_income?: number;
  emergency_contact?: string;
  emergency_phone?: string;
  // Masked fields for secure display
  email_masked?: string;
  phone_masked?: string;
  national_id_masked?: string;
  emergency_phone_masked?: string;
}

interface LeaseAgreement {
  id: string;
  property_id: string;
  tenant_id: string;
  monthly_rent: number;
  start_date: string;
  end_date?: string;
  status: string;
  deposit_amount?: number;
  lease_terms?: string;
  property_owner_id: string;
}

interface TenantDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  document_category?: string;
  description?: string;
  uploaded_at: string;
  tenant_id?: string;
  lease_id?: string;
}

const Portfolio = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isPro, subscriptionTier } = useSubscription();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertyDocuments, setPropertyDocuments] = useState<Record<string, any[]>>({});
  const [propertyTenants, setPropertyTenants] = useState<Record<string, (Tenant & { leases: LeaseAgreement[] })[]>>({});
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  
  // Auto valuation states
  const [autoValuationEnabled, setAutoValuationEnabled] = useState(false);
  const [isUpdatingValues, setIsUpdatingValues] = useState(false);
  
  // Debug subscription status
  console.log('User subscription status:', { isPro, subscriptionTier, user: !!user });
  
  // Dialog states
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [rentalAgreementDialogOpen, setRentalAgreementDialogOpen] = useState(false);

  // Example property for logged in users with no properties
  const exampleProperty = [
    {
      id: "example-1",
      address: "Storgata 15",
      city: "Oslo",
      postal_code: "0155",
      property_type: "Leilighet",
      size_sqm: 85,
      bedrooms: 2,
      purchase_price: 2800000,
      purchase_date: "2022-03-15",
      current_value: 3200000,
      monthly_rent: 25000,
      demo_cashflow: 2200,
      owner_id: "example"
    }
  ];

  // Mock portfolio data for non-authenticated users
  const mockProperties = [
    {
      id: "mock-1",
      address: "Storgata 15",
      city: "Oslo",
      postal_code: "0155",
      property_type: "Leilighet",
      size_sqm: 85,
      bedrooms: 2,
      purchase_price: 2800000,
      purchase_date: "2022-03-15",
      current_value: 3200000,
      monthly_rent: 25000,
      demo_cashflow: 2800,
      owner_id: "mock"
    },
    {
      id: "mock-2", 
      address: "Havnegata 7",
      city: "Kabelvåg",
      postal_code: "8310",
      property_type: "Leilighet",
      size_sqm: 65,
      bedrooms: 2,
      purchase_price: 1600000,
      purchase_date: "2021-11-20",
      current_value: 1850000,
      monthly_rent: 16000,
      demo_cashflow: 800,
      owner_id: "mock"
    },
    {
      id: "mock-3",
      address: "Grünerløkka 8",
      city: "Oslo", 
      postal_code: "0554",
      property_type: "Leilighet",
      size_sqm: 95,
      bedrooms: 3,
      purchase_price: 3100000,
      purchase_date: "2023-01-10",
      current_value: 3350000,
      demo_cashflow: 300,
      owner_id: "mock"
    }
  ];

  useEffect(() => {
    if (user) {
      fetchUserProperties();
      // Set up real-time subscription for property updates
      const channel = supabase
        .channel('properties-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'properties',
            filter: `owner_id=eq.${user.id}`
          },
          () => {
            fetchUserProperties();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      // Not logged in - show mock data
      setProperties(mockProperties);
      setLoading(false);
    }
  }, [user]);

  // Fetch documents and tenants for all user properties
  useEffect(() => {
    if (user && properties.length > 0) {
      fetchAllPropertyDocuments();
      fetchAllPropertyTenants();
    }
  }, [user, properties]);

  const toggleAutoValuation = async () => {
    if (!isPro) {
      toast({
        title: "Pro-funksjon",
        description: "Automatisk eiendomsvurdering krever Pro-abonnement",
        variant: "destructive"
      });
      return;
    }

    if (!autoValuationEnabled) {
      setAutoValuationEnabled(true);
      setIsUpdatingValues(true);
      
      try {
        await updateAllPropertyValues();
        toast({
          title: "Automatisk verdiestimering aktivert",
          description: "Eiendomsverdier oppdateres automatisk",
        });
      } catch (error) {
        console.error('Error updating property values:', error);
        setAutoValuationEnabled(false);
        toast({
          title: "Feil ved aktivering",
          description: "Kunne ikke aktivere automatisk verdiestimering",
          variant: "destructive"
        });
      } finally {
        setIsUpdatingValues(false);
      }
    } else {
      setAutoValuationEnabled(false);
      toast({
        title: "Automatisk verdiestimering deaktivert",
        description: "Eiendomsverdier oppdateres ikke lenger automatisk",
      });
    }
  };

  const updateAllPropertyValues = async () => {
    if (!user || !properties.length) return;

    const updatePromises = properties.map(async (property) => {
      if (property.id.startsWith('example') || property.id.startsWith('mock')) return;
      
      try {
        const { data, error } = await supabase.functions.invoke('property-valuation', {
          body: {
            address: property.address,
            postalCode: property.postal_code,
            city: property.city,
            propertyId: property.id
          }
        });

        if (error) {
          console.error(`Error getting valuation for ${property.address}:`, error);
          return;
        }

        if (data?.estimatedValue) {
          // Update property with new current_value
          const { error: updateError } = await supabase
            .from('properties')
            .update({ current_value: data.estimatedValue })
            .eq('id', property.id);

          if (updateError) {
            console.error(`Error updating property ${property.id}:`, updateError);
          }
        }
      } catch (error) {
        console.error(`Error processing property ${property.address}:`, error);
      }
    });

    await Promise.all(updatePromises);
    
    // Refresh properties to show updated values
    await fetchUserProperties();
  };

  const fetchAllPropertyTenants = async () => {
    if (!user) return;
    
    try {
      const tenantsByProperty: Record<string, (Tenant & { leases: LeaseAgreement[] })[]> = {};
      
      // Use secure tenant access through the security library
      const { data: secureTenantsData, error: tenantsError } = await getTenantsWithMaskedData(user.id);
      
      if (tenantsError) {
        console.error('Error fetching secure tenant data:', tenantsError);
        // Set empty arrays for all properties and return
        properties.forEach(property => {
          tenantsByProperty[property.id] = [];
        });
        setPropertyTenants(tenantsByProperty);
        return;
      }
      
      for (const property of properties) {
        if (property.id !== 'example-1') {
          // Fetch lease agreements for this property
          const { data: leases, error: leasesError } = await supabase
            .from('lease_agreements')
            .select('*')
            .eq('property_id', property.id)
            .eq('property_owner_id', user.id)
            .order('start_date', { ascending: false });

          if (leasesError) {
            console.error(`Error fetching leases for property ${property.id}:`, leasesError);
            tenantsByProperty[property.id] = [];
            continue;
          }

          // Match secure tenants to leases for this property
          const propertyTenants = (secureTenantsData || [])
            .filter(tenant => tenant.id && leases?.some(lease => lease.tenant_id === tenant.id))
            .map(tenant => ({
              ...tenant,
              id: tenant.id!, // Ensure id is not undefined
              leases: leases?.filter(lease => lease.tenant_id === tenant.id) || []
            } as Tenant & { leases: LeaseAgreement[] }));

          tenantsByProperty[property.id] = propertyTenants;
          
          // Log secure access for audit trail
          if (propertyTenants.length > 0) {
            await logTenantDataAccess('view_property_tenants', property.id, {
              property_id: property.id,
              tenant_count: propertyTenants.length,
              access_type: 'masked_display'
            });
          }
        } else {
          tenantsByProperty[property.id] = [];
        }
      }
      
      setPropertyTenants(tenantsByProperty);
    } catch (error) {
      console.error('Error fetching property tenants:', error);
      // Set empty tenant arrays for all properties on error
      const emptyTenants: Record<string, (Tenant & { leases: LeaseAgreement[] })[]> = {};
      properties.forEach(property => {
        emptyTenants[property.id] = [];
      });
      setPropertyTenants(emptyTenants);
    }
  };

  const fetchAllPropertyDocuments = async () => {
    if (!user) return;
    
    console.log('Fetching documents for all properties:', properties);
    
    try {
      const documentsByProperty: Record<string, any[]> = {};
      
      for (const property of properties) {
        if (property.id !== 'example-1') { // Skip example properties
          console.log(`Fetching documents for property ${property.id}:`, property.address);
          
          const { data, error } = await supabase
            .from('property_documents')
            .select('*')
            .eq('property_id', property.id)
            .order('uploaded_at', { ascending: false });

          console.log(`Documents for property ${property.id}:`, { data, error });
          
          if (error) {
            console.error(`Error fetching documents for property ${property.id}:`, error);
            documentsByProperty[property.id] = [];
          } else {
            documentsByProperty[property.id] = data || [];
          }
        } else {
          documentsByProperty[property.id] = [];
        }
      }
      
      console.log('All property documents:', documentsByProperty);
      setPropertyDocuments(documentsByProperty);
    } catch (error) {
      console.error('Error fetching property documents:', error);
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm("Er du sikker på at du vil slette denne eiendommen? Dette kan ikke angres.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: "Eiendom slettet",
        description: "Eiendommen er permanent fjernet fra systemet",
      });

      fetchUserProperties();
    } catch (error) {
      console.error('Error deleting property:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke slette eiendommen",
        variant: "destructive",
      });
    }
  };

  const fetchUserProperties = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        setProperties([]);
        return;
      }

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching properties:', error);
        toast({
          title: "Feil",
          description: "Feil ved henting av eiendommer",
          variant: "destructive",
        });
        return;
      }

      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "Feil",
        description: "Feil ved henting av eiendommer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const showExampleProperty = user && properties.length === 0 && !loading;
  const displayProperties = !user ? mockProperties : (showExampleProperty ? exampleProperty : properties);

  const totalInvestment = displayProperties.reduce((sum, prop) => sum + (prop.purchase_price || 0), 0);
  const currentPortfolioValue = displayProperties.reduce((sum, prop) => sum + (prop.current_value || prop.purchase_price || 0), 0);
  const totalReturn = currentPortfolioValue - totalInvestment;
  const averageROI = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;

  // Mock data for price development chart (for demo purposes)
  const priceChartData = [
    { 
      month: 'Jan 2022', 
      'Storgata 15': 2800000, 
        'Havnegata 7': 1600000, 
        'Grünerløkka 8': 3100000 
    },
    { 
      month: 'Apr 2022', 
      'Storgata 15': 2850000, 
        'Havnegata 7': 1580000, 
        'Grünerløkka 8': 3120000 
    },
    { 
      month: 'Jul 2022', 
      'Storgata 15': 2920000, 
        'Havnegata 7': 1650000, 
        'Grünerløkka 8': 3150000 
    },
    { 
      month: 'Okt 2022', 
      'Storgata 15': 2980000, 
        'Havnegata 7': 1720000, 
        'Grünerløkka 8': 3200000 
    },
    { 
      month: 'Jan 2023', 
      'Storgata 15': 3050000, 
        'Havnegata 7': 1750000, 
        'Grünerløkka 8': 3280000 
    },
    { 
      month: 'Apr 2023', 
      'Storgata 15': 3100000, 
        'Havnegata 7': 1780000, 
        'Grünerløkka 8': 3320000 
    },
    { 
      month: 'Jul 2023', 
      'Storgata 15': 3150000, 
        'Havnegata 7': 1810000, 
        'Grünerløkka 8': 3340000 
    },
    { 
      month: 'Okt 2023', 
      'Storgata 15': 3180000, 
        'Havnegata 7': 1830000, 
        'Grünerløkka 8': 3350000 
    },
    { 
      month: 'Jan 2024', 
      'Storgata 15': 3200000, 
        'Havnegata 7': 1850000, 
        'Grünerløkka 8': 3350000 
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {!user ? "Demo Portefølje" : "Min Portefølje"}
              </h1>
              <p className="text-muted-foreground">
                {!user 
                  ? "Eksempel på hvordan din portefølje vil se ut" 
                  : "Oversikt over dine eiendomsinvesteringer og dokumenter"
                }
              </p>
            </div>
            {user && (
              <PropertyAddDialog onPropertyAdded={fetchUserProperties}>
                <Button className="bg-gradient-primary hover:opacity-90">
                  <Plus className="h-4 w-4 mr-2" />
                  Legg til eiendom
                </Button>
              </PropertyAddDialog>
            )}
            {showExampleProperty && (
              <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-800">
                Eksempeleiendom - Legg til din første eiendom
              </Badge>
            )}
          </div>

          {/* Portfolio Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-medium">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Totale eiendommer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{displayProperties.length}</div>
                {(!user || showExampleProperty) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {!user ? "Demo eiendommer" : "Eksempeleiendom"}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total investering
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{totalInvestment.toLocaleString()} kr</div>
                {(!user || showExampleProperty) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {!user ? "Demo beløp" : "Eksempelverdi"}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className={`shadow-medium transition-all duration-300 ${autoValuationEnabled && isPro ? 'ring-2 ring-blue-400 shadow-blue-400/20' : ''}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Nåværende verdi
                  {isPro && user && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`ml-auto h-6 w-6 p-0 transition-colors ${autoValuationEnabled ? 'text-blue-500 hover:text-blue-600' : 'text-muted-foreground hover:text-foreground'}`}
                      onClick={() => toggleAutoValuation()}
                      disabled={isUpdatingValues}
                    >
                      <Gauge className="h-3 w-3" animated={isUpdatingValues} />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{currentPortfolioValue.toLocaleString()} kr</div>
                {autoValuationEnabled && isPro && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <p className="text-xs text-blue-600">Automatisk oppdatering aktiv</p>
                  </div>
                )}
                {(!user || showExampleProperty) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {!user ? "Demo verdi" : "Eksempelverdi"}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Total avkastning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">
                  {averageROI >= 0 ? '+' : ''}{averageROI.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {totalReturn >= 0 ? '+' : ''}{totalReturn.toLocaleString()} kr
                </div>
                {(!user || showExampleProperty) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {!user ? "Demo avkastning" : "Eksempelberegning"}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="properties" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="properties" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Eiendommer
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Dokumenter
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analyse
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="space-y-6">
            <div className="grid gap-4">
               {displayProperties.map((property) => {
                 const isPrimaryHome = property.primary_residence;
                 const isUserProperty = user && !showExampleProperty;
                const totalReturn = property.current_value && property.purchase_price ? 
                  property.current_value - property.purchase_price : 0;
                const roiPercentage = property.purchase_price && property.current_value ? 
                  ((property.current_value - property.purchase_price) / property.purchase_price) * 100 : 0;
                
                return (
                  <Card 
                    key={property.id} 
                    className={`shadow-medium transition-all duration-300 ${
                      isPrimaryHome && isUserProperty 
                        ? 'ring-2 ring-orange-400 shadow-orange-400/20 shadow-2xl' 
                        : ''
                    }`}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-3 overflow-hidden">
                        {/* Property Image and Basic Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                          <div className="relative flex-shrink-0">
                            <PropertyImage
                              imageUrl={property.image_url}
                              address={property.address}
                              city={property.city}
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg"
                              alt={`Eiendom på ${property.address}`}
                            />
                            {isPrimaryHome && isUserProperty && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse shadow-lg shadow-orange-400/50"></div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <h3 className="font-semibold text-foreground text-sm sm:text-base mb-1 truncate">
                              {property.address}, {property.postal_code} {property.city}
                            </h3>
                            <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-muted-foreground">
                              <span className="whitespace-nowrap">Type: <span className="text-foreground">{property.property_type || 'Leilighet'}</span></span>
                              <span className="whitespace-nowrap">Størrelse: <span className="text-foreground">{property.size_sqm ? `${property.size_sqm}m²` : '85m²'}</span></span>
                              <span className="whitespace-nowrap">Kjøpsdato: <span className="text-foreground">{property.purchase_date ? new Date(property.purchase_date).toLocaleDateString('no-NO') : '2022-03-15'}</span></span>
                            </div>
                          </div>
                        </div>

                        {/* Financial Tiles */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 flex-shrink-0 overflow-x-auto">
                          <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-[90px]">
                            <p className="text-xs text-muted-foreground mb-1">Kjøpspris</p>
                            <p className="font-semibold text-xs">{property.purchase_price?.toLocaleString() || '2.800.000'} kr</p>
                          </div>
                          <div className={`text-center p-2 rounded-lg min-w-[90px] relative transition-all duration-300 ${
                            autoValuationEnabled && isPro 
                              ? 'bg-blue-100 dark:bg-blue-900/30' 
                              : 'bg-blue-50 dark:bg-blue-900/20'
                          }`}>
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <p className="text-xs text-muted-foreground">Nåverdi</p>
                              {isPro && user && !showExampleProperty && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-4 w-4 p-0 transition-colors ${
                                    autoValuationEnabled ? 'text-blue-500 hover:text-blue-600' : 'text-muted-foreground hover:text-foreground'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleAutoValuation();
                                  }}
                                  disabled={isUpdatingValues}
                                >
                                  <Gauge className="h-3 w-3" animated={isUpdatingValues} />
                                </Button>
                              )}
                            </div>
                            <p className="font-semibold text-xs text-blue-600 dark:text-blue-400">
                              {(property.current_value || property.purchase_price)?.toLocaleString() || '3.200.000'} kr
                            </p>
                            {autoValuationEnabled && isPro && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg min-w-[90px]">
                            <p className="text-xs text-muted-foreground mb-1">Total avkastning</p>
                            <p className="font-semibold text-xs text-green-600 dark:text-green-400">
                              +{roiPercentage.toFixed(1)}%
                            </p>
                          </div>
                          <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg min-w-[90px]">
                            <p className="text-xs text-muted-foreground mb-1">Gevinst</p>
                            <p className="font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                              +{totalReturn.toLocaleString()} kr
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 flex-shrink-0 w-full sm:w-auto">
                          {user && !showExampleProperty ? (
                            <TooltipProvider>
                              <div className="grid grid-cols-2 gap-2 flex-shrink-0">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="w-full h-8 lg:w-8 lg:h-8 lg:min-w-0 lg:p-0"
                                      onClick={() => {
                                        setSelectedProperty(property);
                                        setDetailsDialogOpen(true);
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Detaljer</p>
                                  </TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="w-full h-8 lg:w-8 lg:h-8 lg:min-w-0 lg:p-0"
                                      onClick={() => {
                                        console.log('Opening documents for property:', property.id);
                                        setSelectedProperty(property);
                                        setDocumentsDialogOpen(true);
                                      }}
                                    >
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Dokumenter</p>
                                  </TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="w-full h-8 lg:w-8 lg:h-8 lg:min-w-0 lg:p-0"
                                      onClick={() => {
                                        setSelectedProperty(property);
                                        setEditDialogOpen(true);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Rediger</p>
                                  </TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="destructive" 
                                      size="sm" 
                                      className="w-full h-8 lg:w-8 lg:h-8 lg:min-w-0 lg:p-0 hover:bg-red-600 dark:hover:bg-red-500"
                                      onClick={() => handleDeleteProperty(property.id)}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Slett</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                          ) : (
                            <TooltipProvider>
                              <div className="grid grid-cols-2 gap-2 flex-shrink-0">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="w-full h-8 lg:w-8 lg:h-8 lg:min-w-0 lg:p-0"
                                      onClick={() => navigate('/auth')}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Detaljer</p>
                                  </TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="w-full h-8 lg:w-8 lg:h-8 lg:min-w-0 lg:p-0"
                                      onClick={() => navigate('/auth')}
                                    >
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Dokumenter</p>
                                  </TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="w-full h-8 lg:w-8 lg:h-8 lg:min-w-0 lg:p-0"
                                      onClick={() => navigate('/auth')}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Rediger</p>
                                  </TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="w-full h-8 lg:w-8 lg:h-8 lg:min-w-0 lg:p-0 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-800/30"
                                      onClick={() => navigate('/auth')}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Slett</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
               })}
             </div>
           </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <div className="space-y-6">
              {displayProperties.map((property, index) => {
                const tenants = user ? (propertyTenants[property.id] || []) : [];
                const docs = user ? (propertyDocuments[property.id] || []) : [];
                
                // Separate global documents from tenant-specific ones
                const globalDocs = docs.filter(doc => 
                  !doc.tenant_id && 
                  !doc.lease_id &&
                  ['purchase_contract', 'valuation_report', 'insurance', 'other'].includes(doc.document_category || 'other')
                );
                
                return (
                  <Card key={property.id} className="shadow-medium">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {property.address}
                        {property.postal_code && `, ${property.postal_code}`} {property.city}
                      </CardTitle>
                      <CardDescription>
                        {user ? "Dokumenter og leiehistorikk for denne eiendommen" : "Eksempel på dokumenthåndtering"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Global Documents Section */}
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                          Eiendomsdokumenter
                        </h4>
                        {user ? (
                          globalDocs.length > 0 ? (
                            <div className="space-y-2">
                              {globalDocs.map((document) => (
                                <div key={document.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                      <p className="font-medium">{document.file_name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {document.file_type?.split('/')[1]?.toUpperCase() || 'FILE'} • {document.document_category}
                                        {document.file_size && ` • ${(document.file_size / 1024).toFixed(1)} KB`}
                                      </p>
                                      {document.description && (
                                        <p className="text-xs text-muted-foreground mt-1">{document.description}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          const { data } = await supabase.storage
                                            .from('property-documents')
                                            .createSignedUrl(document.file_path, 3600);
                                          
                                          if (data?.signedUrl) {
                                            window.open(data.signedUrl, '_blank');
                                          }
                                        } catch (error) {
                                          console.error('Error viewing document:', error);
                                          toast({
                                            title: "Feil",
                                            description: "Kunne ikke åpne dokumentet",
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          const { data } = await supabase.storage
                                            .from('property-documents')
                                            .download(document.file_path);
                                          
                                          if (data) {
                                            const url = URL.createObjectURL(data);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = document.file_name;
                                            a.click();
                                            URL.revokeObjectURL(url);
                                          }
                                        } catch (error) {
                                          console.error('Error downloading document:', error);
                                          toast({
                                            title: "Feil", 
                                            description: "Kunne ikke laste ned dokumentet",
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground bg-muted/50 rounded-lg">
                              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Ingen globale dokumenter ennå</p>
                            </div>
                          )
                        ) : (
                          // Demo global documents for non-authenticated users
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Kjøpekontrakt</p>
                                  <p className="text-sm text-muted-foreground">PDF • Demo dokument</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" disabled>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" disabled>
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Takstrapport</p>
                                  <p className="text-sm text-muted-foreground">PDF • Demo dokument</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" disabled>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" disabled>
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tenant Documents Section */}
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                          Leiehistorikk og dokumenter
                        </h4>
                        {user ? (
                          tenants.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {tenants.map((tenant) => {
                                const tenantDocs = docs.filter(doc => doc.tenant_id === tenant.id || 
                                  tenant.leases.some(lease => lease.id === doc.lease_id));
                                const activeLease = tenant.leases.find(lease => lease.status === 'active');
                                const latestLease = tenant.leases[0]; // Already sorted by start_date desc
                                
                                return (
                                  <Card 
                                    key={tenant.id} 
                                    className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                                      selectedTenant === tenant.id 
                                        ? 'border-primary shadow-primary/20' 
                                        : 'border-border hover:border-primary/50'
                                    }`}
                                    onClick={() => setSelectedTenant(selectedTenant === tenant.id ? null : tenant.id)}
                                  >
                                    <CardHeader className="pb-3">
                                      <div className="flex items-center justify-between">
                                        <CardTitle className="text-base">
                                          {tenant.first_name} {tenant.last_name}
                                        </CardTitle>
                                        <Badge variant={activeLease ? "default" : "secondary"}>
                                          {activeLease ? "Aktiv" : "Tidligere"}
                                        </Badge>
                                      </div>
                                      {latestLease && (
                                        <CardDescription>
                                          {latestLease.start_date} - {latestLease.end_date || "Pågående"}
                                          {latestLease.monthly_rent && ` • ${latestLease.monthly_rent.toLocaleString()} kr/mnd`}
                                        </CardDescription>
                                      )}
                                    </CardHeader>
                                    <CardContent>
                                      <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">
                                          {tenantDocs.length} dokument{tenantDocs.length !== 1 ? 'er' : ''}
                                        </p>
                                        <div className="text-xs text-muted-foreground">
                                          {tenant.leases.length} leieperiode{tenant.leases.length !== 1 ? 'r' : ''}
                                        </div>
                                      </div>
                                      
                                      {selectedTenant === tenant.id && (
                                        <div className="mt-4 pt-4 border-t space-y-3">
                                          <h5 className="text-sm font-medium">Dokumenter:</h5>
                                          {tenantDocs.length > 0 ? (
                                            <div className="space-y-2">
                                              {tenantDocs.map((document) => (
                                                <div key={document.id} className="flex items-center justify-between p-2 bg-background rounded">
                                                  <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                      <p className="text-sm font-medium">{document.file_name}</p>
                                                      <p className="text-xs text-muted-foreground">
                                                        {document.document_category} • {document.uploaded_at ? new Date(document.uploaded_at).toLocaleDateString('no-NO') : ''}
                                                      </p>
                                                    </div>
                                                  </div>
                                                  <div className="flex gap-1">
                                                    <Button 
                                                      variant="ghost" 
                                                      size="sm"
                                                      onClick={async (e) => {
                                                        e.stopPropagation();
                                                        try {
                                                          const { data } = await supabase.storage
                                                            .from('property-documents')
                                                            .createSignedUrl(document.file_path, 3600);
                                                          
                                                          if (data?.signedUrl) {
                                                            window.open(data.signedUrl, '_blank');
                                                          }
                                                        } catch (error) {
                                                          console.error('Error viewing document:', error);
                                                          toast({
                                                            title: "Feil",
                                                            description: "Kunne ikke åpne dokumentet",
                                                            variant: "destructive",
                                                          });
                                                        }
                                                      }}
                                                    >
                                                      <Eye className="h-3 w-3" />
                                                    </Button>
                                                    <Button 
                                                      variant="ghost" 
                                                      size="sm"
                                                      onClick={async (e) => {
                                                        e.stopPropagation();
                                                        try {
                                                          const { data } = await supabase.storage
                                                            .from('property-documents')
                                                            .download(document.file_path);
                                                          
                                                          if (data) {
                                                            const url = URL.createObjectURL(data);
                                                            const a = document.createElement('a');
                                                            a.href = url;
                                                            a.download = document.file_name;
                                                            a.click();
                                                            URL.revokeObjectURL(url);
                                                          }
                                                        } catch (error) {
                                                          console.error('Error downloading document:', error);
                                                          toast({
                                                            title: "Feil", 
                                                            description: "Kunne ikke laste ned dokumentet",
                                                            variant: "destructive",
                                                          });
                                                        }
                                                      }}
                                                    >
                                                      <Download className="h-3 w-3" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <p className="text-xs text-muted-foreground">Ingen dokumenter tilknyttet denne leietakeren ennå</p>
                                          )}
                                          
                                          {tenant.leases.length > 1 && (
                                            <div className="mt-3">
                                              <h5 className="text-sm font-medium mb-2">Leieperioder:</h5>
                                              <div className="space-y-1">
                                                {tenant.leases.map((lease) => (
                                                  <div key={lease.id} className="text-xs text-muted-foreground flex justify-between">
                                                    <span>{lease.start_date} - {lease.end_date || "Pågående"}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                      {lease.status}
                                                    </Badge>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-muted-foreground">
                              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>Ingen leiehistorikk ennå</p>
                              <p className="text-sm mt-2">Opprett leieavtaler i utleie-seksjonen for å se leietakerdokumenter her</p>
                            </div>
                          )
                        ) : (
                          // Demo tenant tiles for non-authenticated users
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="border-2 border-border">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-base">Lavik Brygge</CardTitle>
                                  <Badge variant="secondary">Tidligere</Badge>
                                </div>
                                <CardDescription>
                                  2022-03-01 - 2023-02-28 • 25.000 kr/mnd
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="flex items-center justify-between">
                                  <p className="text-sm text-muted-foreground">3 dokumenter</p>
                                  <p className="text-xs text-muted-foreground">1 leieperiode</p>
                                </div>
                              </CardContent>
                            </Card>
                            
                            <Card className="border-2 border-primary shadow-primary/20">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-base">Kari Nordmann</CardTitle>
                                  <Badge variant="default">Aktiv</Badge>
                                </div>
                                <CardDescription>
                                  2023-03-01 - Pågående • 27.000 kr/mnd
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="flex items-center justify-between">
                                  <p className="text-sm text-muted-foreground">5 dokumenter</p>
                                  <p className="text-xs text-muted-foreground">1 leieperiode</p>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </div>

                      {/* Upload Button */}
                      <div className="pt-4 border-t">
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            setSelectedProperty(property);
                            setDocumentsDialogOpen(true);
                          }}
                          disabled={!user}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Last opp nytt dokument
                        </Button>
                        {!user && index === 0 && (
                          <p className="text-xs text-center text-muted-foreground mt-2">
                            Logg inn for å laste opp dokumenter
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Show message when user is logged in but has no properties */}
            {user && properties.length === 0 ? (
              <Card className="shadow-medium">
                <CardContent className="p-8 text-center">
                  <PieChart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Ingen analysedata tilgjengelig</h3>
                  <p className="text-muted-foreground mb-4">
                    Legg til dine eiendommer for å se detaljert porteføljeanalyse
                  </p>
                  <PropertyAddDialog onPropertyAdded={fetchUserProperties}>
                    <Button className="bg-gradient-primary hover:opacity-90">
                      <Plus className="h-4 w-4 mr-2" />
                      Legg til din første eiendom
                    </Button>
                  </PropertyAddDialog>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-medium">
                  <CardHeader>
                    <CardTitle>Porteføljeytelse</CardTitle>
                    <CardDescription>
                      {user && !showExampleProperty ? "Din faktiske utvikling" : "Eksempel på porteføljeanalyse"}
                    </CardDescription>
                  </CardHeader>
                   <CardContent className="space-y-4">
                      <div className="text-center p-6 bg-gradient-soft rounded-lg">
                        <h4 className="text-lg font-semibold mb-2">Total verdiøkning</h4>
                        <p className="text-3xl font-bold text-primary">
                          {totalReturn >= 0 ? '+' : ''}{totalReturn.toLocaleString()} kr
                        </p>
                        <p className="text-muted-foreground">
                          {averageROI >= 0 ? '+' : ''}{averageROI.toFixed(1)}% siden oppstart
                        </p>
                        {(!user || showExampleProperty) && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {!user ? "Demo tall" : "Legg til eiendommer for å se din faktiske utvikling"}
                          </p>
                        )}
                      </div>
                      {(() => {
                        const totalRentalIncome = displayProperties
                          .filter(p => p.monthly_rent)
                          .reduce((sum, p) => sum + (p.monthly_rent || 0), 0);
                        const monthsSinceStart = displayProperties.length > 0 ? 
                          Math.max(1, Math.floor((new Date().getTime() - new Date(displayProperties[0].purchase_date || '2022-03-15').getTime()) / (1000 * 60 * 60 * 24 * 30))) : 0;
                        const totalRentalEarned = totalRentalIncome * monthsSinceStart;
                        
                        if (totalRentalIncome > 0) {
                          return (
                            <div className="text-center p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                              <h4 className="text-lg font-semibold mb-2 text-emerald-800 dark:text-emerald-200">Total leieinntekt siden oppstart</h4>
                              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                                +{totalRentalEarned.toLocaleString()} kr
                              </p>
                              <p className="text-muted-foreground">
                                {totalRentalIncome.toLocaleString()} kr/måned fra {displayProperties.filter(p => p.monthly_rent).length} utleieobjekt{displayProperties.filter(p => p.monthly_rent).length !== 1 ? 'er' : ''}
                              </p>
                              {(!user || showExampleProperty) && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  {!user ? "Demo leieinntekt" : "Basert på dine utleieeiendommer"}
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}
                  </CardContent>
                </Card>

                <Card className="shadow-medium">
                  <CardHeader>
                    <CardTitle>Beste investering</CardTitle>
                    <CardDescription>
                      {user && !showExampleProperty ? "Høyest avkastning i din portefølje" : "Eksempel på beste investering"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const bestProperty = displayProperties.reduce((best, current) => {
                        const currentROI = current.purchase_price && current.current_value ? 
                          ((current.current_value - current.purchase_price) / current.purchase_price) * 100 : 0;
                        const bestROI = best.purchase_price && best.current_value ? 
                          ((best.current_value - best.purchase_price) / best.purchase_price) * 100 : 0;
                        return currentROI > bestROI ? current : best;
                      });
                      const bestROI = bestProperty.purchase_price && bestProperty.current_value ? 
                        ((bestProperty.current_value - bestProperty.purchase_price) / bestProperty.purchase_price) * 100 : 0;
                      const bestReturn = bestProperty.current_value && bestProperty.purchase_price ? 
                        bestProperty.current_value - bestProperty.purchase_price : 0;
                      
                      return (
                        <div className="space-y-3">
                          <div className="p-4 bg-primary-soft rounded-lg">
                            <h4 className="font-semibold text-primary">
                              {bestProperty.address}
                              {bestProperty.postal_code && `, ${bestProperty.postal_code}`} {bestProperty.city}
                            </h4>
                            <p className="text-2xl font-bold text-primary mt-2">
                              +{bestROI.toFixed(1)}% avkastning
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Gevinst: +{bestReturn.toLocaleString()} kr
                            </p>
                            {(!user || showExampleProperty) && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {!user ? "Demo eiendom" : "Basert på dine eiendommer"}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Diversification Chart - Only show if there are properties to analyze */}
            {displayProperties.length > 0 && (
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle>Portefølje diversifisering</CardTitle>
                  <CardDescription>
                    {user && !showExampleProperty ? "Fordeling av dine investeringer" : "Eksempel på diversifisering"}
                  </CardDescription>
                </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {displayProperties.map((property) => {
                        const percentage = property.purchase_price && totalInvestment > 0 ? 
                          (property.purchase_price / totalInvestment) * 100 : 0;
                        return (
                          <div key={property.id} className="text-center p-4 bg-muted rounded-lg">
                            <h5 className="font-semibold text-sm mb-2">
                              {property.address}
                              {property.postal_code && `, ${property.postal_code}`}
                            </h5>
                            <p className="text-2xl font-bold text-primary">{percentage.toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground">av portefølje</p>
                          </div>
                        );
                      })}
                    </div>
                    {(!user || showExampleProperty) && (
                      <p className="text-xs text-center text-muted-foreground mt-4">
                        {!user ? "Demo diversifisering" : "Legg til flere eiendommer for bedre diversifisering"}
                      </p>
                    )}
                   </CardContent>
               </Card>
             )}
                
             {/* Price Development Chart */}
             <Card className="shadow-medium">
               <CardHeader>
                 <CardTitle className="text-xl flex items-center gap-2">
                   <TrendingUp className="h-5 w-5" />
                   Prisutvikling
                 </CardTitle>
                 <CardDescription>
                   {!user ? "Demo prisutvikling for eksempeleiendommene" : "Verdiutvikling for dine eiendommer"}
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="h-80">
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={priceChartData}>
                       <CartesianGrid strokeDasharray="3 3" />
                       <XAxis dataKey="month" />
                       <YAxis 
                         tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M kr`}
                       />
                        <RechartsTooltip 
                          formatter={(value: number) => [`${value.toLocaleString()} kr`, '']}
                          labelFormatter={(label) => `Måned: ${label}`}
                        />
                       <Legend />
                       <Line 
                         type="monotone" 
                         dataKey="Storgata 15" 
                         stroke="hsl(var(--primary))" 
                         strokeWidth={3}
                         dot={{ fill: 'hsl(var(--primary))' }}
                       />
                       <Line 
                         type="monotone" 
                         dataKey="Bogstadveien 42" 
                         stroke="hsl(var(--orange))" 
                         strokeWidth={3}
                         dot={{ fill: 'hsl(var(--orange))' }}
                       />
                       <Line 
                         type="monotone" 
                         dataKey="Grünerløkka 8" 
                         stroke="hsl(var(--accent))" 
                         strokeWidth={3}
                         dot={{ fill: 'hsl(var(--accent))' }}
                       />
                     </LineChart>
                   </ResponsiveContainer>
                 </div>
                 {(!user || showExampleProperty) && (
                   <p className="text-xs text-center text-muted-foreground mt-4">
                     {!user ? "Demo prisutvikling" : "Legg til flere eiendommer for å se faktisk prisutvikling"}
                   </p>
                 )}
               </CardContent>
             </Card>
           </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      {selectedProperty && (
        <>
          <PropertyEditDialog
            property={selectedProperty}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onPropertyUpdated={fetchUserProperties}
          />
          <PropertyDetailsDialog
            property={selectedProperty}
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
          />
          <PropertyDocumentsDialog
            property={selectedProperty}
            open={documentsDialogOpen}
            onOpenChange={(open) => {
              setDocumentsDialogOpen(open);
              // Refresh documents when dialog closes
              if (!open) {
                fetchAllPropertyDocuments();
              }
            }}
          />
        </>
      )}

      {/* Rental Agreement Dialog */}
      <RentalAgreementDialog
        open={rentalAgreementDialogOpen}
        onOpenChange={setRentalAgreementDialogOpen}
        properties={properties}
        onPropertyAdded={fetchUserProperties}
      />
    </div>
  );
};

export default Portfolio;