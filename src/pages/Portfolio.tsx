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
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
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

const Portfolio = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);

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
      owner_id: "mock"
    },
    {
      id: "mock-2", 
      address: "Bogstadveien 42",
      city: "Oslo",
      postal_code: "0366",
      property_type: "Leilighet",
      size_sqm: 65,
      bedrooms: 1,
      purchase_price: 2200000,
      purchase_date: "2021-11-20",
      current_value: 2650000,
      monthly_rent: 22000,
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
      owner_id: "mock"
    }
  ];

  useEffect(() => {
    if (user) {
      fetchUserProperties();
    } else {
      setProperties(mockProperties);
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

  const showExampleProperty = user && properties.length === 0;
  const displayProperties = !user ? mockProperties : (showExampleProperty ? exampleProperty : properties);

  const totalInvestment = displayProperties.reduce((sum, prop) => sum + (prop.purchase_price || 0), 0);
  const currentPortfolioValue = displayProperties.reduce((sum, prop) => sum + (prop.current_value || prop.purchase_price || 0), 0);
  const totalReturn = currentPortfolioValue - totalInvestment;
  const averageROI = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;

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

            <Card className="shadow-medium">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Nåværende verdi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{currentPortfolioValue.toLocaleString()} kr</div>
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
                const isPrimaryHome = !property.monthly_rent;
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
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Property Image and Basic Info */}
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="relative">
                            <PropertyImage
                              imageUrl={property.image_url}
                              address={property.address}
                              city={property.city}
                              className="w-16 h-16 rounded-lg flex-shrink-0"
                              alt={`Eiendom på ${property.address}`}
                            />
                            {isPrimaryHome && isUserProperty && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse shadow-lg shadow-orange-400/50"></div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-foreground text-base mb-1">
                              {property.address}, {property.postal_code} {property.city}
                            </h3>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span>Type: <span className="text-foreground">{property.property_type || 'Leilighet'}</span></span>
                              <span>Størrelse: <span className="text-foreground">{property.size_sqm ? `${property.size_sqm}m²` : '85m²'}</span></span>
                              <span>Kjøpsdato: <span className="text-foreground">{property.purchase_date ? new Date(property.purchase_date).toLocaleDateString('no-NO') : '2022-03-15'}</span></span>
                            </div>
                          </div>
                        </div>

                        {/* Financial Tiles */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0">
                          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-[120px]">
                            <p className="text-xs text-muted-foreground mb-1">Kjøpspris</p>
                            <p className="font-semibold text-sm">{property.purchase_price?.toLocaleString() || '2.800.000'} kr</p>
                          </div>
                          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg min-w-[120px]">
                            <p className="text-xs text-muted-foreground mb-1">Nåverdi</p>
                            <p className="font-semibold text-sm text-blue-600 dark:text-blue-400">
                              {(property.current_value || property.purchase_price)?.toLocaleString() || '3.200.000'} kr
                            </p>
                          </div>
                          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg min-w-[120px]">
                            <p className="text-xs text-muted-foreground mb-1">Total avkastning</p>
                            <p className="font-semibold text-sm text-green-600 dark:text-green-400">
                              +{roiPercentage.toFixed(1)}%
                            </p>
                          </div>
                          <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg min-w-[120px]">
                            <p className="text-xs text-muted-foreground mb-1">Gevinst</p>
                            <p className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                              +{totalReturn.toLocaleString()} kr
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex lg:flex-col gap-2 flex-shrink-0">
                          {user && !showExampleProperty ? (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 lg:flex-none lg:w-32"
                                onClick={() => {
                                  setSelectedProperty(property);
                                  setDetailsDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Detaljer
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 lg:flex-none lg:w-32"
                                onClick={() => {
                                  console.log('Opening documents for property:', property.id);
                                  setSelectedProperty(property);
                                  setDocumentsDialogOpen(true);
                                }}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Dokumenter
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 lg:flex-none lg:w-32"
                                onClick={() => {
                                  setSelectedProperty(property);
                                  setEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Rediger
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                className="flex-1 lg:flex-none lg:w-32"
                                onClick={() => handleDeleteProperty(property.id)}
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Slett
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="outline" size="sm" className="flex-1 lg:flex-none lg:w-32" disabled>
                                <Eye className="h-4 w-4 mr-2" />
                                Detaljer
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1 lg:flex-none lg:w-32" disabled>
                                <FileText className="h-4 w-4 mr-2" />
                                Dokumenter
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1 lg:flex-none lg:w-32" disabled>
                                <Edit className="h-4 w-4 mr-2" />
                                Rediger
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1 lg:flex-none lg:w-32" disabled>
                                <Trash className="h-4 w-4 mr-2" />
                                Slett
                              </Button>
                            </>
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
              {displayProperties.map((property, index) => (
                <Card key={property.id} className="shadow-medium">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {property.address}
                      {property.postal_code && `, ${property.postal_code}`} {property.city}
                    </CardTitle>
                    <CardDescription>
                      {user ? "Dine dokumenter tilknyttet denne eiendommen" : "Eksempel på dokumenthåndtering"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {user ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Klikk på "Dokumenter" ved eiendommen for å administrere filer</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Kjøpekontrakt</p>
                              <p className="text-sm text-muted-foreground">
                                PDF • Demo dokument
                              </p>
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
                              <p className="text-sm text-muted-foreground">
                                PDF • Demo dokument
                              </p>
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
                        <Button variant="outline" className="w-full mt-4" disabled>
                          <Upload className="h-4 w-4 mr-2" />
                          Last opp nytt dokument
                        </Button>
                        {index === 0 && (
                          <p className="text-xs text-center text-muted-foreground">
                            Logg inn for å laste opp dokumenter
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
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
            onOpenChange={setDocumentsDialogOpen}
          />
        </>
      )}
    </div>
  );
};

export default Portfolio;