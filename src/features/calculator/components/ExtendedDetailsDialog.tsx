import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Upload, FileText, Building2, AlertTriangle, Target, Shield, TrendingUp, TrendingDown } from 'lucide-react';

interface ExtendedDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DocumentUpload {
  id: string;
  name: string;
  type: string;
  size: number;
}

export const ExtendedDetailsDialog = ({ open, onOpenChange }: ExtendedDetailsDialogProps) => {
  const [ownershipType, setOwnershipType] = useState<string>('');
  const [financingStructure, setFinancingStructure] = useState<string>('');
  const [privateLoans, setPrivateLoans] = useState<string>('');
  const [privateLoanDetails, setPrivateLoanDetails] = useState<string>('');
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [bestCase, setBestCase] = useState<string>('');
  const [worstCase, setWorstCase] = useState<string>('');
  const [planA, setPlanA] = useState<string>('');
  const [planB, setPlanB] = useState<string>('');
  const [planC, setPlanC] = useState<string>('');

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newDocuments = files.map(file => ({
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      size: file.size
    }));
    setDocuments(prev => [...prev, ...newDocuments]);
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Utvidede Eiendomsdetaljer
          </DialogTitle>
          <DialogDescription>
            Legg til detaljert informasjon for en fullstendig bankrapport
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Ownership and Financing Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Eierskap og Finansiering
              </CardTitle>
              <CardDescription>
                Informasjon om selskapsform og finansieringsstruktur
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ownership-type">Selskapsform</Label>
                  <Select value={ownershipType} onValueChange={setOwnershipType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg selskapsform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Privat person</SelectItem>
                      <SelectItem value="as">AS (Aksjeselskap)</SelectItem>
                      <SelectItem value="ens">ENK (Enkeltpersonforetak)</SelectItem>
                      <SelectItem value="ans">ANS (Ansvarlig selskap)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="financing-structure">Finansieringsstruktur</Label>
                  <Select value={financingStructure} onValueChange={setFinancingStructure}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg finansieringsstruktur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank-only">Kun banklån</SelectItem>
                      <SelectItem value="mixed">Blandet finansiering</SelectItem>
                      <SelectItem value="private-heavy">Hovedsakelig private lån</SelectItem>
                      <SelectItem value="cash">Kontantoppgjør</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="private-loans">Benytter du private lån uten bank?</Label>
                <Select value={privateLoans} onValueChange={setPrivateLoans}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg alternativ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Nei, kun banklån</SelectItem>
                    <SelectItem value="yes">Ja, delvis private lån</SelectItem>
                    <SelectItem value="mostly">Ja, hovedsakelig private lån</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {privateLoans !== 'no' && privateLoans !== '' && (
                <div className="space-y-2">
                  <Label htmlFor="private-loan-details">Detaljer om private lån</Label>
                  <Textarea
                    id="private-loan-details"
                    value={privateLoanDetails}
                    onChange={(e) => setPrivateLoanDetails(e.target.value)}
                    placeholder="Beskriv de private lånene (rentesats, tilbakebetalingsplan, sikkerhet, etc.)"
                    rows={3}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Dokumentasjon
              </CardTitle>
              <CardDescription>
                Last opp relevante dokumenter som vedlegg til rapporten
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Dra og slipp filer her, eller klikk for å velge
                </p>
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleDocumentUpload}
                  className="hidden"
                  id="document-upload"
                />
                <Label htmlFor="document-upload" className="cursor-pointer">
                  <Button type="button" variant="outline">
                    Velg filer
                  </Button>
                </Label>
              </div>

              {documents.length > 0 && (
                <div className="space-y-2">
                  <Label>Opplastede dokumenter ({documents.length})</Label>
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm font-medium">{doc.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {formatFileSize(doc.size)}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeDocument(doc.id)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Assessment Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Risikovurdering
              </CardTitle>
              <CardDescription>
                Analyser best case og worst case scenarioer for investeringen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="best-case" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Best Case Scenario
                  </Label>
                  <Textarea
                    id="best-case"
                    value={bestCase}
                    onChange={(e) => setBestCase(e.target.value)}
                    placeholder="Beskriv det mest optimistiske utfallet (høy leiepris, verdiøkning, lav vedlikehold, etc.)"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="worst-case" className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    Worst Case Scenario
                  </Label>
                  <Textarea
                    id="worst-case"
                    value={worstCase}
                    onChange={(e) => setWorstCase(e.target.value)}
                    placeholder="Beskriv det mest pessimistiske utfallet (tomgang, verdifall, store reparasjoner, etc.)"
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Mitigation Plans */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Risikohåndtering
              </CardTitle>
              <CardDescription>
                Dine planer for å håndtere ulike risikoscenarioer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plan-a" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Plan A - Hovedstrategi
                  </Label>
                  <Textarea
                    id="plan-a"
                    value={planA}
                    onChange={(e) => setPlanA(e.target.value)}
                    placeholder="Din primære plan for å håndtere risiko og sikre lønnsomhet"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan-b">Plan B - Alternativ strategi</Label>
                  <Textarea
                    id="plan-b"
                    value={planB}
                    onChange={(e) => setPlanB(e.target.value)}
                    placeholder="Backup-plan dersom Plan A ikke fungerer som forventet"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan-c">Plan C - Nødplan</Label>
                  <Textarea
                    id="plan-c"
                    value={planC}
                    onChange={(e) => setPlanC(e.target.value)}
                    placeholder="Siste utvei - hvordan minimere tap i verste fall"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button>
              Legg til utvidede detaljer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};