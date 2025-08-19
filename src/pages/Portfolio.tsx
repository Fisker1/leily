import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
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
  Download
} from "lucide-react";

const Portfolio = () => {
  // Mock portfolio data
  const properties = [
    {
      id: 1,
      address: "Storgata 15, 0155 Oslo",
      purchasePrice: 2800000,
      purchaseDate: "2022-03-15",
      currentValue: 3200000,
      type: "Leilighet",
      size: "85m²",
      roi: 14.3,
      totalReturn: 400000,
      documents: [
        { name: "Kjøpekontrakt", type: "PDF", date: "2022-03-15" },
        { name: "Takstrapport", type: "PDF", date: "2022-03-10" },
        { name: "Forsikringspolise", type: "PDF", date: "2022-03-20" }
      ]
    },
    {
      id: 2,
      address: "Bogstadveien 42, 0366 Oslo", 
      purchasePrice: 2200000,
      purchaseDate: "2021-11-20",
      currentValue: 2650000,
      type: "Leilighet",
      size: "65m²",
      roi: 20.5,
      totalReturn: 450000,
      documents: [
        { name: "Kjøpekontrakt", type: "PDF", date: "2021-11-20" },
        { name: "Takstrapport", type: "PDF", date: "2021-11-15" }
      ]
    },
    {
      id: 3,
      address: "Grünerløkka 8, 0554 Oslo",
      purchasePrice: 3100000,
      purchaseDate: "2023-01-10",
      currentValue: 3350000,
      type: "Leilighet", 
      size: "95m²",
      roi: 8.1,
      totalReturn: 250000,
      documents: [
        { name: "Kjøpekontrakt", type: "PDF", date: "2023-01-10" },
        { name: "Takstrapport", type: "PDF", date: "2023-01-05" },
        { name: "Forsikringspolise", type: "PDF", date: "2023-01-15" },
        { name: "Renoveringsregninger", type: "PDF", date: "2023-03-20" }
      ]
    }
  ];

  const totalInvestment = properties.reduce((sum, prop) => sum + prop.purchasePrice, 0);
  const currentPortfolioValue = properties.reduce((sum, prop) => sum + prop.currentValue, 0);
  const totalReturn = currentPortfolioValue - totalInvestment;
  const averageROI = (totalReturn / totalInvestment) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Min Portefølje</h1>
              <p className="text-muted-foreground">Oversikt over dine eiendomsinvesteringer og dokumenter</p>
            </div>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Legg til eiendom
            </Button>
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
                <div className="text-2xl font-bold text-primary">{properties.length}</div>
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
            <div className="grid gap-6">
              {properties.map((property) => (
                <Card key={property.id} className="shadow-medium">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                      {/* Property Info */}
                      <div className="lg:col-span-2">
                        <h3 className="text-lg font-semibold text-foreground mb-2">{property.address}</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <span>{property.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Størrelse:</span>
                            <span>{property.size}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Kjøpsdato:</span>
                            <span>{property.purchaseDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Financial Info */}
                      <div className="lg:col-span-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <p className="text-muted-foreground">Kjøpspris</p>
                            <p className="font-semibold">{property.purchasePrice.toLocaleString()} kr</p>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <p className="text-muted-foreground">Nåverdi</p>
                            <p className="font-semibold text-primary">{property.currentValue.toLocaleString()} kr</p>
                          </div>
                          <div className="text-center p-3 bg-primary-soft rounded-lg">
                            <p className="text-muted-foreground">Total avkastning</p>
                            <p className="font-semibold text-primary">
                              {property.roi >= 0 ? '+' : ''}{property.roi}%
                            </p>
                          </div>
                          <div className="text-center p-3 bg-accent/10 rounded-lg">
                            <p className="text-muted-foreground">Gevinst</p>
                            <p className="font-semibold text-accent">
                              {property.totalReturn >= 0 ? '+' : ''}{property.totalReturn.toLocaleString()} kr
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="lg:col-span-1 flex flex-col gap-2">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          Detaljer
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          <FileText className="h-4 w-4 mr-2" />
                          Dokumenter ({property.documents.length})
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <div className="space-y-6">
              {properties.map((property) => (
                <Card key={property.id} className="shadow-medium">
                  <CardHeader>
                    <CardTitle className="text-lg">{property.address}</CardTitle>
                    <CardDescription>Dokumenter tilknyttet denne eiendommen</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {property.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {doc.type} • Lastet opp {doc.date}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full mt-4">
                        <Upload className="h-4 w-4 mr-2" />
                        Last opp nytt dokument
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle>Porteføljeytelse</CardTitle>
                  <CardDescription>Utvikling over tid</CardDescription>
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
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle>Beste investering</CardTitle>
                  <CardDescription>Høyest avkastning i porteføljen</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const bestProperty = properties.reduce((best, current) => 
                      current.roi > best.roi ? current : best
                    );
                    return (
                      <div className="space-y-3">
                        <div className="p-4 bg-primary-soft rounded-lg">
                          <h4 className="font-semibold text-primary">{bestProperty.address}</h4>
                          <p className="text-2xl font-bold text-primary mt-2">
                            +{bestProperty.roi}% avkastning
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Gevinst: +{bestProperty.totalReturn.toLocaleString()} kr
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Portefølje diversifisering</CardTitle>
                <CardDescription>Fordeling av investeringer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {properties.map((property) => {
                    const percentage = (property.purchasePrice / totalInvestment) * 100;
                    return (
                      <div key={property.id} className="text-center p-4 bg-muted rounded-lg">
                        <h5 className="font-semibold text-sm mb-2">{property.address}</h5>
                        <p className="text-2xl font-bold text-primary">{percentage.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">av portefølje</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Portfolio;