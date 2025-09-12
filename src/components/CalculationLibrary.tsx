import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Library, 
  Calculator, 
  Eye, 
  Trash, 
  Edit, 
  Calendar,
  MapPin,
  DollarSign,
  TrendingUp,
  Plus
} from "lucide-react";
import { useCalculationHistory, CalculationHistoryItem } from "@/hooks/useCalculationHistory";
import { useAuth } from "@/contexts/AuthContext";
import { formatNumberWithSpaces } from "@/lib/utils";

interface CalculationLibraryProps {
  onLoadCalculation?: (calculation: CalculationHistoryItem) => void;
  onSaveCurrentCalculation?: () => void;
  currentCalculationData?: any;
}

const CalculationLibrary = ({ 
  onLoadCalculation, 
  onSaveCurrentCalculation,
  currentCalculationData 
}: CalculationLibraryProps) => {
  const { user } = useAuth();
  const { calculations, loading, deleteCalculation } = useCalculationHistory();
  const [selectedCalculation, setSelectedCalculation] = useState<CalculationHistoryItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [calculationToDelete, setCalculationToDelete] = useState<string | null>(null);

  const handleViewCalculation = (calculation: CalculationHistoryItem) => {
    setSelectedCalculation(calculation);
  };

  const handleLoadCalculation = (calculation: CalculationHistoryItem) => {
    onLoadCalculation?.(calculation);
    setSelectedCalculation(null);
  };

  const handleDeleteClick = (calculationId: string) => {
    setCalculationToDelete(calculationId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (calculationToDelete) {
      await deleteCalculation(calculationToDelete);
      setDeleteDialogOpen(false);
      setCalculationToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('no-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCalculationSummary = (data: any) => {
    const totalPrice = parseFloat(data.totalPrice) || 0;
    const monthlyRent = data.isRental ? parseFloat(data.expectedAnnualRent) / 12 || 0 : 0;
    const yield_ = data.isRental && totalPrice > 0 ? (parseFloat(data.expectedAnnualRent) / totalPrice * 100) : 0;

    return {
      totalPrice,
      monthlyRent,
      yield: yield_,
      isRental: data.isRental,
      propertyType: data.propertyType
    };
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <Library className="h-12 w-12 text-muted-foreground" />
          <h3 className="text-xl font-semibold">Kalkulasjonsbibliotek</h3>
          <p className="text-muted-foreground">
            Logg inn for å lagre og gjenbruke dine eiendomskalkulasjoner
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Library className="h-5 w-5" />
            Kalkulasjonsbibliotek
          </CardTitle>
          <CardDescription>
            Se, gjenbruk og administrer dine tidligere eiendomskalkulasjoner
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentCalculationData && onSaveCurrentCalculation && (
            <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Aktiv kalkulasjon</h4>
                  <p className="text-sm text-muted-foreground">
                    Lagre den nåværende kalkulasjonen til biblioteket
                  </p>
                </div>
                <Button 
                  onClick={onSaveCurrentCalculation}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Lagre kalkulasjon
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Laster kalkulasjoner...</p>
            </div>
          ) : calculations.length === 0 ? (
            <div className="text-center py-8">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ingen kalkulasjoner ennå</h3>
              <p className="text-muted-foreground">
                Dine lagrede eiendomskalkulasjoner vil vises her
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {calculations.map((calculation) => {
                const summary = getCalculationSummary(calculation.calculation_data);
                return (
                  <Card key={calculation.id} className="hover:shadow-medium transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">
                              {calculation.calculation_name || 'Navnløs kalkulasjon'}
                            </h4>
                            {calculation.finn_code && (
                              <Badge variant="outline" className="text-xs">
                                Finn: {calculation.finn_code}
                              </Badge>
                            )}
                          </div>
                          
                          {calculation.property_address && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                              <MapPin className="h-3 w-3" />
                              {calculation.property_address}
                            </div>
                          )}

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Type</p>
                              <p className="font-medium capitalize">{summary.propertyType || 'Ikke oppgitt'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Pris</p>
                              <p className="font-medium">{formatNumberWithSpaces(summary.totalPrice)} kr</p>
                            </div>
                            {summary.isRental && (
                              <>
                                <div>
                                  <p className="text-muted-foreground">Mnd. leie</p>
                                  <p className="font-medium">{formatNumberWithSpaces(summary.monthlyRent)} kr</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Avkastning</p>
                                  <p className="font-medium text-primary">{summary.yield.toFixed(1)}%</p>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                            <Calendar className="h-3 w-3" />
                            Lagret {formatDate(calculation.created_at)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewCalculation(calculation)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(calculation.id)}
                            className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Calculation Dialog */}
      <Dialog open={!!selectedCalculation} onOpenChange={() => setSelectedCalculation(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              {selectedCalculation?.calculation_name || 'Kalkulasjonsdetaljer'}
            </DialogTitle>
            <DialogDescription>
              Lagret {selectedCalculation && formatDate(selectedCalculation.created_at)}
            </DialogDescription>
          </DialogHeader>

          {selectedCalculation && (
            <div className="space-y-6">
              {/* Calculation Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedCalculation.finn_code && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium">Finn-kode</p>
                    <p className="text-lg">{selectedCalculation.finn_code}</p>
                  </div>
                )}
                
                {selectedCalculation.property_address && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium">Adresse</p>
                    <p className="text-lg">{selectedCalculation.property_address}</p>
                  </div>
                )}

                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">Eiendomstype</p>
                  <p className="text-lg capitalize">
                    {selectedCalculation.calculation_data.propertyType || 'Ikke oppgitt'}
                  </p>
                </div>
              </div>

              {/* Results Summary */}
              {selectedCalculation.results_data && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Kalkulasjonsresultater</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-3 text-center">
                        <DollarSign className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="text-sm text-muted-foreground">Totalpris</p>
                        <p className="font-semibold">
                          {formatNumberWithSpaces(selectedCalculation.results_data.totalPrice || 0)} kr
                        </p>
                      </CardContent>
                    </Card>

                    {selectedCalculation.calculation_data.isRental && (
                      <>
                        <Card>
                          <CardContent className="p-3 text-center">
                            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-600" />
                            <p className="text-sm text-muted-foreground">Månedlig leie</p>
                            <p className="font-semibold">
                              {formatNumberWithSpaces(selectedCalculation.results_data.monthlyRent || 0)} kr
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-3 text-center">
                            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-accent" />
                            <p className="text-sm text-muted-foreground">Avkastning</p>
                            <p className="font-semibold">
                              {(selectedCalculation.results_data.yield || 0).toFixed(1)}%
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-3 text-center">
                            <DollarSign className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                            <p className="text-sm text-muted-foreground">Pengestrøm</p>
                            <p className={`font-semibold ${
                              (selectedCalculation.results_data.monthlyCashFlow || 0) >= 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {(selectedCalculation.results_data.monthlyCashFlow || 0) >= 0 ? '+' : ''}
                              {formatNumberWithSpaces(selectedCalculation.results_data.monthlyCashFlow || 0)} kr
                            </p>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedCalculation(null)}
                >
                  Lukk
                </Button>
                <Button
                  onClick={() => handleLoadCalculation(selectedCalculation)}
                  className="flex items-center gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  Last inn kalkulasjon
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett kalkulasjon</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette denne kalkulasjonen? Dette kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CalculationLibrary;