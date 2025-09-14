import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Link2, Calculator } from 'lucide-react';
import { useCalculationHistory } from '@/hooks/useCalculationHistory';
import { formatNumberWithSpaces } from '@/lib/utils';

export default function BuildingPlannerBasic() {
  const [projectType, setProjectType] = useState<'new' | 'link' | null>(null);
  const [projectName, setProjectName] = useState('');
  const [selectedCalculation, setSelectedCalculation] = useState<string>('');
  const { calculations } = useCalculationHistory();

  const resetProject = () => {
    setProjectType(null);
    setProjectName('');
    setSelectedCalculation('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Byggeplanlegger</CardTitle>
          <CardDescription>
            Tegn og planlegg din byggeprosjekt med interaktiv tegning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!projectType ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Velg prosjekttype</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center space-y-2"
                  onClick={() => setProjectType('new')}
                >
                  <Plus className="h-8 w-8" />
                  <div className="text-center">
                    <div className="font-semibold">Nytt prosjekt</div>
                    <div className="text-sm text-muted-foreground">Start fra bunnen av</div>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center space-y-2"
                  onClick={() => setProjectType('link')}
                >
                  <Link2 className="h-8 w-8" />
                  <div className="text-center">
                    <div className="font-semibold">Knytt til kalkulator</div>
                    <div className="text-sm text-muted-foreground">Bruk eksisterende beregning</div>
                  </div>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {projectType === 'new' ? 'Nytt byggeprosjekt' : 'Knytt til kalkulator'}
                </h3>
                <Button variant="ghost" size="sm" onClick={resetProject}>
                  Tilbake
                </Button>
              </div>

              {projectType === 'new' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="project-name">Prosjektnavn</Label>
                    <Input
                      id="project-name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Mitt byggeprosjekt"
                    />
                  </div>
                  
                  <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
                    <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h4 className="font-semibold mb-2">Byggeplanlegger kommer snart</h4>
                    <p className="text-sm text-muted-foreground">
                      Interaktiv tegning og planlegging av byggeprosjekter er under utvikling.
                    </p>
                    {projectName && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm">
                          <strong>Prosjekt:</strong> {projectName}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {projectType === 'link' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="calculation-select">Velg kalkulator-beregning</Label>
                    <Select value={selectedCalculation} onValueChange={setSelectedCalculation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg en beregning" />
                      </SelectTrigger>
                      <SelectContent>
                        {calculations.length === 0 ? (
                          <SelectItem value="no-calculations" disabled>
                            Ingen lagrede beregninger
                          </SelectItem>
                        ) : (
                          calculations.map((calc) => (
                            <SelectItem key={calc.id} value={calc.id}>
                              <div className="flex flex-col">
                                <span>{calc.calculation_name || 'Uten navn'}</span>
                                {calc.property_address && (
                                  <span className="text-xs text-muted-foreground">
                                    {calc.property_address}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
                    <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h4 className="font-semibold mb-2">Byggeplanlegger kommer snart</h4>
                    <p className="text-sm text-muted-foreground">
                      Interaktiv tegning og planlegging av byggeprosjekter er under utvikling.
                    </p>
                    {selectedCalculation && selectedCalculation !== 'no-calculations' && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm">
                          <strong>Tilknyttet kalkulator:</strong> {
                            calculations.find(c => c.id === selectedCalculation)?.calculation_name || 'Valgt beregning'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}