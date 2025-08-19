import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
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
  Edit
} from "lucide-react";

const Rental = () => {
  // Mock data for rental properties
  const properties = [
    {
      id: 1,
      address: "Storgata 15, 0155 Oslo",
      type: "Leilighet",
      size: "85m²",
      bedrooms: 3,
      rent: 25000,
      tenant: "Aktiv leietaker",
      leaseEnd: "2025-06-30",
      status: "Utleid",
      yield: 6.2,
      image: "/api/placeholder/400/300"
    },
    {
      id: 2,
      address: "Bogstadveien 42, 0366 Oslo",
      type: "Leilighet", 
      size: "65m²",
      bedrooms: 2,
      rent: 22000,
      tenant: "Ledig",
      leaseEnd: null,
      status: "Ledig",
      yield: 5.8,
      image: "/api/placeholder/400/300"
    },
    {
      id: 3,
      address: "Grünerløkka 8, 0554 Oslo",
      type: "Leilighet",
      size: "95m²", 
      bedrooms: 4,
      rent: 28000,
      tenant: "Aktiv leietaker",
      leaseEnd: "2024-12-31",
      status: "Utleid",
      yield: 7.1,
      image: "/api/placeholder/400/300"
    }
  ];

  const totalRent = properties.reduce((sum, prop) => sum + (prop.status === "Utleid" ? prop.rent : 0), 0);
  const occupancyRate = (properties.filter(p => p.status === "Utleid").length / properties.length) * 100;
  const averageYield = properties.reduce((sum, prop) => sum + prop.yield, 0) / properties.length;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Utleieoversikt</h1>
              <p className="text-muted-foreground">Administrer og få oversikt over dine utleieeiendommer</p>
            </div>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Legg til eiendom
            </Button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-medium">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Totale eiendommer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{properties.length}</div>
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
                <div className="text-2xl font-bold text-primary">{totalRent.toLocaleString()} kr</div>
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
                <div className="text-2xl font-bold text-accent">{occupancyRate.toFixed(1)}%</div>
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Gjennomsnittlig yield
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{averageYield.toFixed(1)}%</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Properties List */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Mine eiendommer</h2>
          
          <div className="grid gap-6">
            {properties.map((property) => (
              <Card key={property.id} className="shadow-medium hover:shadow-large transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Property Image */}
                    <div className="lg:col-span-1">
                      <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Property Details */}
                    <div className="lg:col-span-2 space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{property.address}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{property.type}</span>
                          <span>{property.size}</span>
                          <span>{property.bedrooms} soverom</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Månedlig leie</p>
                          <p className="font-semibold text-primary">{property.rent.toLocaleString()} kr</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Yield</p>
                          <p className="font-semibold text-accent">{property.yield}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Leietaker</p>
                          <p className="font-medium">{property.tenant}</p>
                        </div>
                        {property.leaseEnd && (
                          <div>
                            <p className="text-muted-foreground">Leiekontrakt utløp</p>
                            <p className="font-medium">{property.leaseEnd}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="lg:col-span-1 flex flex-col justify-between">
                      <div className="flex justify-end">
                        <Badge 
                          variant={property.status === "Utleid" ? "default" : "secondary"}
                          className="mb-4"
                        >
                          {property.status}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          Se detaljer
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="h-4 w-4 mr-2" />
                          Rediger
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          <FileText className="h-4 w-4 mr-2" />
                          Dokumenter
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-medium border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">Ny leieavtale</CardTitle>
              <CardDescription>Opprett ny leieavtale for ledig eiendom</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-gradient-primary hover:opacity-90">
                Opprett leieavtale
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-medium border-accent/20">
            <CardHeader>
              <CardTitle className="text-accent">Månedlig rapport</CardTitle>
              <CardDescription>Generer månedsrapport for alle eiendommer</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
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
              <Button variant="outline" className="w-full">
                Start analyse
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Rental;