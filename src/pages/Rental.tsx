import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { PropertyAddDialog } from "@/components/PropertyAddDialog";
import { PropertyEditDialog } from "@/components/PropertyEditDialog";
import { PropertyDetailsDialog } from "@/components/PropertyDetailsDialog";
import { PropertyDocumentsDialog } from "@/components/PropertyDocumentsDialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Users, 
  Calendar,
  TrendingUp,
  Plus,
  FileText,
  Eye,
  Edit,
  Trash,
  Calculator,
  EyeOff,
  Download,
  PenTool,
  BarChart3
} from "lucide-react";
import PropertyImage from "@/components/PropertyImage";
import { useNavigate } from "react-router-dom";
import RentalAgreementDialog from "@/components/RentalAgreementDialog";
import MarketAnalysisDialog from "@/components/MarketAnalysisDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  show_in_rental?: boolean;
}

const Rental = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Access control
  const canCreateRentalAgreement = user?.email === 'anderslundoy@gmail.com';
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [rentalAgreementDialogOpen, setRentalAgreementDialogOpen] = useState(false);
  const [marketAnalysisDialogOpen, setMarketAnalysisDialogOpen] = useState(false);

  // Eksempel eiendom for innloggede brukere uten egne eiendommer
  const exampleProperty = {
    id: 'example',
    address: 'Storgata 15',
    city: 'Oslo',
    postal_code: '0155',
    property_type: 'Leilighet',
    size_sqm: 85,
    bedrooms: 3,
    purchase_price: 4500000,
    current_value: 4500000,
    monthly_rent: 25000,
    demo_cashflow: 2200, // Realistisk cashflow for eksempel
    owner_id: 'example'
  };

  // Mock data for uinnloggede brukere (demo-formål)
  const demoProperties = [
    {
      id: 'demo1',
      address: 'Storgata 15',
      city: 'Oslo', 
      postal_code: '0155',
      property_type: 'Leilighet',
      size_sqm: 85,
      bedrooms: 3,
      purchase_price: 4500000,
      current_value: 4500000,
      monthly_rent: 25000,
      demo_cashflow: 2800, // Realistisk cashflow
      owner_id: 'demo'
    },
    {
      id: 'demo2', 
      address: 'Havnegata 7',
      city: 'Kabelvåg',
      postal_code: '8310',
      property_type: 'Leilighet',
      size_sqm: 65,
      bedrooms: 2,
      purchase_price: 1600000,
      current_value: 1850000,
      monthly_rent: 16000,
      demo_cashflow: 800, // Positiv cashflow
      owner_id: 'demo'
    },
    {
      id: 'demo3',
      address: 'Grünerløkka 8',
      city: 'Oslo',
      postal_code: '0554', 
      property_type: 'Leilighet',
      size_sqm: 95,
      bedrooms: 4,
      purchase_price: 5200000,
      current_value: 5200000,
      monthly_rent: 28000,
      demo_cashflow: 300, // Oransje cashflow (mellom -500 og +500)
      owner_id: 'demo'
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
      // Ikke innlogget - vis demo data
      setProperties(demoProperties);
      setLoading(false);
    }
  }, [user]);

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
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id)
        .eq('show_in_rental', true)
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

      if (data && data.length > 0) {
        setProperties(data);
      } else {
        // Ingen egne eiendommer - vis eksempel
        setProperties([exampleProperty]);
      }
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

  const handleToggleShowInRental = async (propertyId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ show_in_rental: !currentValue })
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: "Oppdatert",
        description: !currentValue ? "Eiendommen vises nå på utleiesiden" : "Eiendommen er skjult fra utleiesiden",
      });

      fetchUserProperties();
    } catch (error) {
      console.error('Error toggling show_in_rental:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke oppdatere visning",
        variant: "destructive",
      });
    }
  };

  const hasUserProperties = user && properties.length > 0 && properties[0].id !== 'example';
  const isExampleProperty = user && properties.length === 1 && properties[0].id === 'example';

  // Cashflow beregninger med fargekoding
  const getCashflowColor = (cashflow: number) => {
    if (cashflow > 0) {
      return 'text-primary'; // Grønn for positiv
    } else {
      return 'text-destructive'; // Rød for negativ
    }
  };

  const getCashflowValue = (property: any) => {
    // For demo properties, bruk realistisk demo_cashflow
    if (property.demo_cashflow !== undefined) {
      return property.demo_cashflow;
    }
    // For ekte eiendommer, bruk eksisterende beregning
    return property.monthly_rent ? Math.round(property.monthly_rent * 0.1) : 0;
  };

  const totalRent = properties.reduce((sum, prop) => sum + (prop.monthly_rent || 0), 0);
  const totalCashflow = properties.reduce((sum, prop) => sum + getCashflowValue(prop), 0);
  const occupancyRate = 100; // Simplified for now
  const averageYield = properties.length > 0 ? 
    (totalRent * 12) / properties.reduce((sum, prop) => sum + (prop.current_value || prop.purchase_price), 0) * 100 : 0;

  const handleCreateRentalAgreement = () => {
    if (!user) {
      toast({
        title: "Logg inn påkrevd",
        description: "Du må logge inn for å opprette leieavtaler",
        variant: "destructive",
      });
      return;
    }

    if (!canCreateRentalAgreement) {
      toast({
        title: "Kommer snart",
        description: "Denne funksjonen er under utvikling og kommer snart!",
        variant: "destructive",
      });
      return;
    }

    // Check if user has properties (not just example properties)
    const realProperties = properties.filter(p => p.id !== 'example');
    if (realProperties.length === 0) {
      toast({
        title: "Ingen eiendommer",
        description: "Du må legge til minst én eiendom før du kan opprette leieavtaler",
        variant: "destructive",
      });
      return;
    }

    setRentalAgreementDialogOpen(true);
  };

  const handleGenerateMonthlyReport = () => {
    if (!user) {
      toast({
        title: "Logg inn påkrevd", 
        description: "Du må logge inn for å generere rapporter",
        variant: "destructive",
      });
      return;
    }

    // Generate monthly rental report with current property data
    const reportData = {
      reportType: 'monthly_rental',
      generatedDate: new Date().toISOString(),
      properties: properties.filter(p => p.id !== 'example'),
      summary: {
        totalProperties: properties.filter(p => p.id !== 'example').length,
        totalRent: totalRent,
        totalCashflow: totalCashflow,
        averageYield: averageYield,
        occupancyRate: occupancyRate
      }
    };

    navigate('/bank-report', { 
      state: { 
        ...reportData,
        basicData: {
          propertyValue: properties.reduce((sum, prop) => sum + (prop.current_value || prop.purchase_price || 0), 0),
          loanAmount: properties.reduce((sum, prop) => sum + (prop.loan_amount || 0), 0),
          monthlyRent: totalRent,
          monthlyCashFlow: totalCashflow,
          calculatorMode: 'rental'
        }
      } 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p>Laster eiendommer...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {!user ? "Utleieoversikt - Demo" : "Utleieoversikt"}
              </h1>
              <p className="text-muted-foreground">
                {!user 
                  ? "Se hvordan du kan administrere dine utleieeiendommer"
                  : isExampleProperty
                    ? "Legg til din første eiendom for å komme i gang"
                    : "Administrer og få oversikt over dine utleieeiendommer"
                }
              </p>
            </div>
            {user && (
              <Button 
                className="bg-gradient-primary hover:opacity-90" 
                onClick={handleCreateRentalAgreement}
                disabled={!canCreateRentalAgreement}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ny leieavtale
                {!canCreateRentalAgreement && <Badge variant="secondary" className="ml-2 text-xs">Kommer snart</Badge>}
              </Button>
            )}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card className="shadow-medium">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Totale eiendommer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {isExampleProperty ? 1 : properties.length}
                </div>
                {isExampleProperty && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Eksempel eiendom
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Månedlige leieinntekter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {totalRent.toLocaleString()} kr
                </div>
                {isExampleProperty && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Eksempel beløp
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Beleggsprosent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">
                  {occupancyRate.toFixed(1)}%
                </div>
                {isExampleProperty && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Eksempel verdi
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Gjennomsnittlig avkastning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">
                  {averageYield.toFixed(1)}%
                </div>
                {isExampleProperty && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Eksempel avkastning
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Månedlig pengestrøm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getCashflowColor(totalCashflow)}`}>
                  {totalCashflow >= 0 ? '+' : ''}{totalCashflow.toLocaleString()} kr
                </div>
                {isExampleProperty && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Eksempel pengestrøm
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Properties List */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-foreground">
              {!user 
                ? "Demo eiendommer" 
                : isExampleProperty 
                  ? "Eksempel eiendom"
                  : "Mine eiendommer"
              }
            </h2>
            {isExampleProperty && (
              <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-800">
                Eksempel - Legg til din egen eiendom
              </Badge>
            )}
          </div>
          
          <div className="grid gap-6">
            {properties.map((property) => (
              <Card 
                key={property.id} 
                className={`shadow-medium hover:shadow-large transition-shadow ${
                  isExampleProperty ? 'border-yellow-200 bg-yellow-50/30' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Property Image */}
                    <div className="lg:col-span-1">
                      <PropertyImage
                        imageUrl={property.image_url}
                        address={property.address}
                        city={property.city}
                        className="w-full h-32 rounded-lg"
                        alt={`Eiendom på ${property.address}`}
                      />
                    </div>

                    {/* Property Details */}
                    <div className="lg:col-span-2 space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {property.address}{property.postal_code && `, ${property.postal_code}`} {property.city}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{property.property_type}</span>
                          <span>{property.size_sqm}m²</span>
                          <span>{property.bedrooms} soverom</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Månedlig leie</p>
                          <p className="font-semibold text-primary">
                            {property.monthly_rent?.toLocaleString() || "Ikke oppgitt"} kr
                          </p>
                        </div>
          <div>
                          <p className="text-muted-foreground">Avkastning</p>
                          <p className="font-semibold text-accent">
                            {property.monthly_rent ? 
                              (((property.monthly_rent * 12) / (property.current_value || property.purchase_price)) * 100).toFixed(1) 
                              : "0"
                            }%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pengestrøm</p>
                          <p className={`font-semibold ${getCashflowColor(getCashflowValue(property))}`}>
                            {getCashflowValue(property) >= 0 ? '+' : ''}{getCashflowValue(property).toLocaleString()} kr
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <Badge 
                            variant={property.monthly_rent ? "default" : "secondary"}
                          >
                            {property.monthly_rent ? "Utleid" : "Ledig"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="lg:col-span-1 flex flex-col justify-between">
                      {!user ? (
                        <TooltipProvider>
                          <div className="grid grid-cols-3 gap-3 w-full max-w-[300px] mx-auto lg:w-28 lg:gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full h-12 lg:w-8 lg:h-8 lg:p-0"
                                  onClick={() => navigate('/auth')}
                                >
                                  <FileText className="h-5 w-5 lg:h-4 lg:w-4" />
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
                                  className="w-full h-12 lg:w-8 lg:h-8 lg:p-0"
                                  onClick={() => navigate('/auth')}
                                >
                                  <Eye className="h-5 w-5 lg:h-4 lg:w-4" />
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
                                  className="w-full h-12 lg:w-8 lg:h-8 lg:p-0"
                                  onClick={() => navigate('/auth')}
                                >
                                  <Edit className="h-5 w-5 lg:h-4 lg:w-4" />
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
                                  className="w-full h-12 lg:w-8 lg:h-8 lg:p-0"
                                  onClick={() => navigate('/auth')}
                                >
                                  <EyeOff className="h-5 w-5 lg:h-4 lg:w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Skjul fra utleie</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full h-12 lg:w-8 lg:h-8 lg:p-0 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-800/30"
                                  onClick={() => navigate('/auth')}
                                >
                                  <Trash className="h-5 w-5 lg:h-4 lg:w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Slett</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      ) : isExampleProperty ? (
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-4">
                            Dette er en eksempel eiendom
                          </p>
                          <PropertyAddDialog>
                            <Button size="sm" className="w-full bg-gradient-primary hover:opacity-90">
                              <Plus className="h-4 w-4 mr-2" />
                              Legg til din eiendom
                            </Button>
                          </PropertyAddDialog>
                        </div>
                      ) : (
                        <TooltipProvider>
                          <div className="grid grid-cols-3 gap-3 w-full max-w-[300px] mx-auto lg:w-36 lg:gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full h-12 lg:w-8 lg:h-8 lg:p-0"
                                  onClick={() => {
                                    setSelectedProperty(property);
                                    setDocumentsDialogOpen(true);
                                  }}
                                >
                                  <FileText className="h-5 w-5 lg:h-4 lg:w-4" />
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
                                  className="w-full h-12 lg:w-8 lg:h-8 lg:p-0"
                                  onClick={() => {
                                    setSelectedProperty(property);
                                    setDetailsDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-5 w-5 lg:h-4 lg:w-4" />
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
                                  className="w-full h-12 lg:w-8 lg:h-8 lg:p-0"
                                  onClick={() => {
                                    setSelectedProperty(property);
                                    setEditDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-5 w-5 lg:h-4 lg:w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Rediger</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant={property.show_in_rental !== false ? "outline" : "default"} 
                                  size="sm" 
                                  className="w-full h-12 lg:w-8 lg:h-8 lg:p-0"
                                  onClick={() => handleToggleShowInRental(property.id, property.show_in_rental !== false)}
                                >
                                  {property.show_in_rental !== false ? (
                                    <EyeOff className="h-5 w-5 lg:h-4 lg:w-4" />
                                  ) : (
                                    <Eye className="h-5 w-5 lg:h-4 lg:w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{property.show_in_rental !== false ? "Skjul fra utleie" : "Vis på utleie"}</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  className="w-full h-12 lg:w-8 lg:h-8 lg:p-0 hover:bg-red-600 dark:hover:bg-red-500"
                                  onClick={() => handleDeleteProperty(property.id)}
                                >
                                  <Trash className="h-5 w-5 lg:h-4 lg:w-4" />
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
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-medium border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                Ny leieavtale
                {!canCreateRentalAgreement && <Badge variant="secondary" className="text-xs">Kommer snart</Badge>}
              </CardTitle>
              <CardDescription>
                {canCreateRentalAgreement 
                  ? "Opprett ny leieavtale for ledig eiendom"
                  : "Denne funksjonen er under utvikling og kommer snart!"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canCreateRentalAgreement ? (
                <Button 
                  className="w-full bg-gradient-primary hover:opacity-90"
                  onClick={handleCreateRentalAgreement}
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  Opprett leieavtale
                </Button>
              ) : (
                <div className="text-center py-4">
                  <PenTool className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    Vi jobber med å gjøre denne funksjonen tilgjengelig.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-medium border-accent/20">
            <CardHeader>
              <CardTitle className="text-accent">Månedlig rapport</CardTitle>
              <CardDescription>Generer månedsrapport for alle eiendommer</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleGenerateMonthlyReport}
              >
                <Download className="h-4 w-4 mr-2" />
                Generer rapport
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Markedsanalyse</CardTitle>
              <CardDescription>Sammenlign dine leiepriser med markedet</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setMarketAnalysisDialogOpen(true)}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Start analyse
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-medium border-secondary/20">
            <CardHeader>
              <CardTitle className="text-secondary">Kalkyle/Nytt kjøp</CardTitle>
              <CardDescription>Analyser nye investeringsmuligheter</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <Calculator className="h-4 w-4 mr-2" />
                Start kalkyle
              </Button>
            </CardContent>
          </Card>
        </div>
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
            onOpenChange={setDocumentsDialogOpen}
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

      {/* Market Analysis Dialog */}
      <MarketAnalysisDialog
        open={marketAnalysisDialogOpen}
        onOpenChange={setMarketAnalysisDialogOpen}
        properties={properties}
      />
    </div>
  );
};

export default Rental;