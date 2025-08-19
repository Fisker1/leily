import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface MarketAnalysisProps {
  propertyValue: number;
  monthlyRent: number;
}

const MarketAnalysis = ({ propertyValue, monthlyRent }: MarketAnalysisProps) => {
  const [averageAreaPrice, setAverageAreaPrice] = useState("2800000");
  const [averageAreaRent, setAverageAreaRent] = useState("20000");
  const [marketGrowth, setMarketGrowth] = useState("4.5");
  const [areaPopularity, setAreaPopularity] = useState("8");

  const priceComparison = ((propertyValue - parseFloat(averageAreaPrice)) / parseFloat(averageAreaPrice)) * 100;
  const rentComparison = ((monthlyRent - parseFloat(averageAreaRent)) / parseFloat(averageAreaRent)) * 100;
  const rentYield = ((monthlyRent * 12) / propertyValue) * 100;
  const marketRentYield = ((parseFloat(averageAreaRent) * 12) / parseFloat(averageAreaPrice)) * 100;
  
  const getComparisonStatus = (percentage: number) => {
    if (percentage > 10) return { status: "Høy", variant: "destructive" as const };
    if (percentage > 0) return { status: "Over snitt", variant: "secondary" as const };
    if (percentage > -10) return { status: "Konkurransedyktig", variant: "default" as const };
    return { status: "Under snitt", variant: "outline" as const };
  };

  const priceStatus = getComparisonStatus(priceComparison);
  const rentStatus = getComparisonStatus(rentComparison);

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="text-primary">Markedsanalyse</CardTitle>
        <CardDescription>
          Sammenlign priser og leieinntekter i området for å forstå markedspotensialet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="avg-price">Gjennomsnittspris i området (kr)</Label>
            <Input
              id="avg-price"
              type="number"
              value={averageAreaPrice}
              onChange={(e) => setAverageAreaPrice(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="avg-rent">Gjennomsnittlig leie i området (kr)</Label>
            <Input
              id="avg-rent"
              type="number"
              value={averageAreaRent}
              onChange={(e) => setAverageAreaRent(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="market-growth">Årlig markedsvekst (%)</Label>
            <Input
              id="market-growth"
              type="number"
              step="0.1"
              value={marketGrowth}
              onChange={(e) => setMarketGrowth(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="area-popularity">Områdepopularitet (1-10)</Label>
            <Input
              id="area-popularity"
              type="number"
              min="1"
              max="10"
              value={areaPopularity}
              onChange={(e) => setAreaPopularity(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Prissammenligning</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Din pris:</span>
                  <span className="font-semibold">{propertyValue.toLocaleString()} kr</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Områdesnitt:</span>
                  <span className="font-semibold">{parseFloat(averageAreaPrice).toLocaleString()} kr</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Avvik:</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${priceComparison >= 0 ? 'text-destructive' : 'text-primary'}`}>
                      {priceComparison >= 0 ? '+' : ''}{priceComparison.toFixed(1)}%
                    </span>
                    <Badge variant={priceStatus.variant}>{priceStatus.status}</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Leiesammenligning</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Din leie:</span>
                  <span className="font-semibold">{monthlyRent.toLocaleString()} kr</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Områdesnitt:</span>
                  <span className="font-semibold">{parseFloat(averageAreaRent).toLocaleString()} kr</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Avvik:</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${rentComparison >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {rentComparison >= 0 ? '+' : ''}{rentComparison.toFixed(1)}%
                    </span>
                    <Badge variant={rentStatus.variant}>{rentStatus.status}</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center p-4 bg-primary-soft rounded-lg">
              <p className="text-sm text-muted-foreground">Din brutto yield</p>
              <p className="text-2xl font-bold text-primary">{rentYield.toFixed(2)}%</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Markedets yield</p>
              <p className="text-2xl font-bold text-foreground">{marketRentYield.toFixed(2)}%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketAnalysis;