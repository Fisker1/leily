import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  FileText, 
  Download, 
  Upload, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileCheck,
  Archive
} from 'lucide-react';

interface LegalDocument {
  id: string;
  document_type: string;
  version: string;
  title: string;
  content: string;
  content_format: string;
  status: string;
  reviewed_by: string | null;
  approved_by: string | null;
  uploaded_by: string | null;
  effective_date: string | null;
  created_at: string;
  updated_at: string;
  notes: string | null;
}

const documentTypes = {
  privacy_policy: 'Personvernpolicy',
  terms_of_service: 'Vilkår for bruk',
  lease_agreement_template: 'Standard Leieavtale',
  cookie_policy: 'Cookie Policy',
};

const statusColors = {
  draft: 'secondary',
  under_review: 'default',
  approved: 'default',
  active: 'default',
  archived: 'destructive',
} as const;

const statusIcons = {
  draft: Clock,
  under_review: AlertCircle,
  approved: CheckCircle,
  active: FileCheck,
  archived: Archive,
};

export const LegalDocumentsManager = () => {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    document_type: '',
    version: '',
    title: '',
    content: '',
    content_format: 'markdown' as 'markdown' | 'html',
    notes: '',
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast.error('Feil ved henting av dokumenter');
    } finally {
      setLoading(false);
    }
  };

  const handleExportMarkdown = (doc: LegalDocument) => {
    const blob = new Blob([doc.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.document_type}_v${doc.version}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Dokumentet er eksportert');
  };

  const handleExportHTML = (doc: LegalDocument) => {
    const blob = new Blob([doc.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.document_type}_v${doc.version}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Dokumentet er eksportert');
  };

  const handleUploadRevised = async () => {
    if (!uploadForm.document_type || !uploadForm.version || !uploadForm.title || !uploadForm.content) {
      toast.error('Vennligst fyll ut alle felter');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Ikke autentisert');

      const { error } = await supabase
        .from('legal_documents')
        .insert({
          document_type: uploadForm.document_type,
          version: uploadForm.version,
          title: uploadForm.title,
          content: uploadForm.content,
          content_format: uploadForm.content_format,
          status: 'under_review',
          uploaded_by: user.id,
          notes: uploadForm.notes,
        });

      if (error) throw error;

      toast.success('Revidert dokument lastet opp for godkjenning');
      setUploadDialogOpen(false);
      setUploadForm({
        document_type: '',
        version: '',
        title: '',
        content: '',
        content_format: 'markdown',
        notes: '',
      });
      fetchDocuments();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error('Feil ved opplasting av dokument');
    }
  };

  const handleStatusChange = async (docId: string, newStatus: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Ikke autentisert');

      const updateData: any = { status: newStatus };
      
      if (newStatus === 'approved') {
        updateData.approved_by = user.id;
      } else if (newStatus === 'active') {
        updateData.approved_by = user.id;
        updateData.effective_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('legal_documents')
        .update(updateData)
        .eq('id', docId);

      if (error) throw error;

      toast.success('Dokumentstatus oppdatert');
      fetchDocuments();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Feil ved oppdatering av status');
    }
  };

  const getActiveDocuments = () => {
    return documents.filter(doc => doc.status === 'active');
  };

  const getPendingReview = () => {
    return documents.filter(doc => doc.status === 'under_review');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Juridiske Dokumenter</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Laster...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Dokumenter</CardTitle>
            <FileCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getActiveDocuments().length}</div>
            <p className="text-xs text-muted-foreground">I bruk på nettsiden</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Venter Godkjenning</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getPendingReview().length}</div>
            <p className="text-xs text-muted-foreground">Reviderte versjoner fra advokat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt Versjoner</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">Alle versjoner inkludert arkiverte</p>
          </CardContent>
        </Card>
      </div>

      {/* Upload New Version */}
      <Card>
        <CardHeader>
          <CardTitle>Last opp Revidert Dokument</CardTitle>
          <CardDescription>
            Last opp reviderte versjoner fra advokat for godkjenning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Upload className="mr-2 h-4 w-4" />
                Last opp Revidert Versjon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Last opp Revidert Dokument</DialogTitle>
                <DialogDescription>
                  Fyll ut informasjon om den reviderte versjonen fra advokat
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="document_type">Dokumenttype</Label>
                  <Select
                    value={uploadForm.document_type}
                    onValueChange={(value) => setUploadForm({ ...uploadForm, document_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg dokumenttype" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(documentTypes).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="version">Versjon</Label>
                  <Input
                    id="version"
                    placeholder="f.eks. 2.0"
                    value={uploadForm.version}
                    onChange={(e) => setUploadForm({ ...uploadForm, version: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Tittel</Label>
                  <Input
                    id="title"
                    placeholder="f.eks. Personvernpolicy"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content_format">Format</Label>
                  <Select
                    value={uploadForm.content_format}
                    onValueChange={(value: 'markdown' | 'html') => 
                      setUploadForm({ ...uploadForm, content_format: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="markdown">Markdown</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Innhold</Label>
                  <Textarea
                    id="content"
                    placeholder="Lim inn innholdet fra advokat..."
                    value={uploadForm.content}
                    onChange={(e) => setUploadForm({ ...uploadForm, content: e.target.value })}
                    className="min-h-[300px] font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notater</Label>
                  <Textarea
                    id="notes"
                    placeholder="Endringer fra forrige versjon, merknader fra advokat, etc."
                    value={uploadForm.notes}
                    onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                    Avbryt
                  </Button>
                  <Button onClick={handleUploadRevised}>
                    Last opp
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Alle Dokumenter</CardTitle>
          <CardDescription>
            Oversikt over alle juridiske dokumenter med versjonskontroll
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Versjon</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sist oppdatert</TableHead>
                <TableHead>Effektiv dato</TableHead>
                <TableHead className="text-right">Handlinger</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => {
                const StatusIcon = statusIcons[doc.status as keyof typeof statusIcons];
                return (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      {documentTypes[doc.document_type as keyof typeof documentTypes]}
                    </TableCell>
                    <TableCell>{doc.version}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[doc.status as keyof typeof statusColors]}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {doc.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(doc.updated_at).toLocaleDateString('no-NO')}
                    </TableCell>
                    <TableCell>
                      {doc.effective_date 
                        ? new Date(doc.effective_date).toLocaleDateString('no-NO')
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedDocument(doc);
                          setPreviewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleExportMarkdown(doc)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {doc.status === 'under_review' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(doc.id, 'approved')}
                        >
                          Godkjenn
                        </Button>
                      )}
                      {doc.status === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(doc.id, 'active')}
                        >
                          Aktiver
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {documents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Ingen dokumenter funnet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDocument && documentTypes[selectedDocument.document_type as keyof typeof documentTypes]}
              {selectedDocument && ` - v${selectedDocument.version}`}
            </DialogTitle>
            <DialogDescription>
              {selectedDocument?.notes && (
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <p className="text-sm"><strong>Notater:</strong> {selectedDocument.notes}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm max-w-none">
            {selectedDocument && selectedDocument.content_format === 'html' ? (
              <div dangerouslySetInnerHTML={{ __html: selectedDocument.content }} />
            ) : (
              <pre className="whitespace-pre-wrap text-sm">{selectedDocument?.content}</pre>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
