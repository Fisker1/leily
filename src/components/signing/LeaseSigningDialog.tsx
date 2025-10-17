import React, { useState, useEffect } from 'react';
import { FileText, Upload, Send, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useScriveSigning, ScriveDocumentRequest } from '@/hooks/useScriveSigning';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface LeaseSigningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaseAgreementId: string;
  leaseData?: {
    property_address: string;
    landlord_name: string;
    landlord_email: string;
    tenant_name: string;
    tenant_email: string;
    monthly_rent: number;
    start_date: string;
    end_date?: string;
  };
}

type SigningStep = 'details' | 'upload' | 'review' | 'sending' | 'sent' | 'error';

export const LeaseSigningDialog: React.FC<LeaseSigningDialogProps> = ({
  open,
  onOpenChange,
  leaseAgreementId,
  leaseData
}) => {
  const { toast } = useToast();
  const { 
    createDocument, 
    uploadFile, 
    sendDocument, 
    loading 
  } = useScriveSigning();

  const [currentStep, setCurrentStep] = useState<SigningStep>('details');
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form data
  const [formData, setFormData] = useState<ScriveDocumentRequest>({
    lease_agreement_id: leaseAgreementId,
    landlord_email: leaseData?.landlord_email || '',
    landlord_name: leaseData?.landlord_name || '',
    tenant_email: leaseData?.tenant_email || '',
    tenant_name: leaseData?.tenant_name || '',
    property_address: leaseData?.property_address || '',
    document_pdf_url: ''
  });

  const [customMessage, setCustomMessage] = useState('');

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setCurrentStep('details');
      setDocumentId(null);
      setSelectedFile(null);
      setUploadProgress(0);
      setFormData({
        lease_agreement_id: leaseAgreementId,
        landlord_email: leaseData?.landlord_email || '',
        landlord_name: leaseData?.landlord_name || '',
        tenant_email: leaseData?.tenant_email || '',
        tenant_name: leaseData?.tenant_name || '',
        property_address: leaseData?.property_address || '',
        document_pdf_url: ''
      });
    }
  }, [open, leaseAgreementId, leaseData]);

  const handleInputChange = (field: keyof ScriveDocumentRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Ugyldig filtype",
          description: "Kun PDF-filer er tillatt",
          variant: "destructive"
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Fil for stor",
          description: "Filen må være mindre enn 10MB",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleCreateDocument = async () => {
    if (!formData.landlord_email || !formData.tenant_email || !formData.landlord_name || !formData.tenant_name) {
      toast({
        title: "Mangler informasjon",
        description: "Fyll ut alle påkrevde felt",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await createDocument(formData);
      setDocumentId(result.document.id);
      setCurrentStep('upload');
    } catch (error) {
      setCurrentStep('error');
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile || !documentId) return;

    try {
      setCurrentStep('upload');
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await uploadFile(documentId, selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setCurrentStep('review');
      }, 500);
    } catch (error) {
      setCurrentStep('error');
    }
  };

  const handleSendDocument = async () => {
    if (!documentId) return;

    try {
      setCurrentStep('sending');
      await sendDocument(documentId, customMessage);
      setCurrentStep('sent');
    } catch (error) {
      setCurrentStep('error');
    }
  };

  const getStepIcon = (step: SigningStep) => {
    switch (step) {
      case 'details':
        return <FileText className="h-5 w-5" />;
      case 'upload':
        return <Upload className="h-5 w-5" />;
      case 'review':
        return <CheckCircle className="h-5 w-5" />;
      case 'sending':
        return <Send className="h-5 w-5" />;
      case 'sent':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStepTitle = (step: SigningStep) => {
    switch (step) {
      case 'details':
        return 'Dokumentdetaljer';
      case 'upload':
        return 'Last opp PDF';
      case 'review':
        return 'Gjennomgå og send';
      case 'sending':
        return 'Sender dokument...';
      case 'sent':
        return 'Dokument sendt';
      case 'error':
        return 'Feil oppstod';
      default:
        return 'Ukjent steg';
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'details':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="landlord-name">Utleier navn *</Label>
                <Input
                  id="landlord-name"
                  value={formData.landlord_name}
                  onChange={(e) => handleInputChange('landlord_name', e.target.value)}
                  placeholder="Ditt fulle navn"
                />
              </div>
              <div>
                <Label htmlFor="landlord-email">Utleier e-post *</Label>
                <Input
                  id="landlord-email"
                  type="email"
                  value={formData.landlord_email}
                  onChange={(e) => handleInputChange('landlord_email', e.target.value)}
                  placeholder="din@epost.no"
                />
              </div>
              <div>
                <Label htmlFor="tenant-name">Leietaker navn *</Label>
                <Input
                  id="tenant-name"
                  value={formData.tenant_name}
                  onChange={(e) => handleInputChange('tenant_name', e.target.value)}
                  placeholder="Leietakers fulle navn"
                />
              </div>
              <div>
                <Label htmlFor="tenant-email">Leietaker e-post *</Label>
                <Input
                  id="tenant-email"
                  type="email"
                  value={formData.tenant_email}
                  onChange={(e) => handleInputChange('tenant_email', e.target.value)}
                  placeholder="leietaker@epost.no"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="property-address">Eiendomsadresse</Label>
              <Input
                id="property-address"
                value={formData.property_address}
                onChange={(e) => handleInputChange('property_address', e.target.value)}
                placeholder="Adresse til eiendommen"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleCreateDocument} disabled={loading}>
                {loading ? 'Oppretter...' : 'Neste steg'}
              </Button>
            </div>
          </div>
        );

      case 'upload':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Last opp leieavtale PDF</h3>
              <p className="text-muted-foreground mb-4">
                Last opp PDF-dokumentet med leieavtalen som skal signeres
              </p>
            </div>

            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="cursor-pointer block"
              >
                {selectedFile ? (
                  <div className="space-y-2">
                    <FileText className="h-8 w-8 mx-auto text-primary" />
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="font-medium">Klikk for å velge PDF-fil</p>
                    <p className="text-sm text-muted-foreground">
                      eller dra og slipp filen her
                    </p>
                  </div>
                )}
              </label>
            </div>

            {selectedFile && (
              <div className="space-y-4">
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Laster opp...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}
                
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFile(null);
                      setUploadProgress(0);
                    }}
                  >
                    Velg annen fil
                  </Button>
                  <Button onClick={handleUploadFile} disabled={loading}>
                    {loading ? 'Laster opp...' : 'Last opp og fortsett'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case 'review':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold mb-2">Dokument klar for signering</h3>
              <p className="text-muted-foreground">
                Gjennomgå detaljene og send dokumentet for signering
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Signeringsdetaljer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Utleier:</span>
                  <span className="font-medium">{formData.landlord_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">E-post:</span>
                  <span className="font-medium">{formData.landlord_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Leietaker:</span>
                  <span className="font-medium">{formData.tenant_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">E-post:</span>
                  <span className="font-medium">{formData.tenant_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Eiendom:</span>
                  <span className="font-medium">{formData.property_address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dokument:</span>
                  <span className="font-medium">{selectedFile?.name}</span>
                </div>
              </CardContent>
            </Card>

            <div>
              <Label htmlFor="custom-message">Tilpasset melding (valgfri)</Label>
              <Textarea
                id="custom-message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Legg til en personlig melding til signeringsdokumentet..."
                rows={3}
              />
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('upload')}
              >
                Tilbake
              </Button>
              <Button onClick={handleSendDocument} disabled={loading}>
                {loading ? 'Sender...' : 'Send for signering'}
              </Button>
            </div>
          </div>
        );

      case 'sending':
        return (
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <h3 className="text-lg font-semibold">Sender dokument...</h3>
            <p className="text-muted-foreground">
              Dokumentet sendes til alle parter for signering
            </p>
          </div>
        );

      case 'sent':
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <h3 className="text-lg font-semibold">Dokument sendt!</h3>
            <p className="text-muted-foreground">
              Signeringsdokumentet er sendt til alle parter. De vil motta e-post med instruksjoner for signering.
            </p>
            
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="outline">Sendt for signering</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Utløper:</span>
                    <span>{format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "PPP", { locale: nb })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={() => onOpenChange(false)} className="w-full">
              Lukk
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
            <h3 className="text-lg font-semibold">Noe gikk galt</h3>
            <p className="text-muted-foreground">
              Det oppstod en feil under prosessen. Prøv igjen eller kontakt support.
            </p>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('details')}
                className="flex-1"
              >
                Start på nytt
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Lukk
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStepIcon(currentStep)}
            {getStepTitle(currentStep)}
          </DialogTitle>
        </DialogHeader>

        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
};




