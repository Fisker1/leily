import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, Download, Trash2, File } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Property {
  id: string;
  address: string;
}

interface PropertyDocument {
  id: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  file_path: string;
  document_category: string;
  description?: string;
  uploaded_at: string;
}

interface PropertyDocumentsDialogProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PropertyDocumentsDialog = ({ property, open, onOpenChange }: PropertyDocumentsDialogProps) => {
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  
  const [uploadData, setUploadData] = useState({
    category: "other",
    description: ""
  });

  useEffect(() => {
    if (open) {
      fetchDocuments();
    }
  }, [open, property.id]);

  const fetchDocuments = async () => {
    try {
      console.log('Fetching documents for property:', property.id);
      const { data, error } = await supabase
        .from('property_documents')
        .select('*')
        .eq('property_id', property.id)
        .order('uploaded_at', { ascending: false });

      console.log('Documents fetch result:', { data, error });
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Feil",
          description: "Du må være logget inn for å laste opp filer",
          variant: "destructive",
        });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${property.id}/${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('property-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save document metadata
      const { error: dbError } = await supabase
        .from('property_documents')
        .insert([{
          property_id: property.id,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_path: fileName,
          document_category: uploadData.category,
          description: uploadData.description || null,
          uploaded_by: user.id
        }]);

      if (dbError) throw dbError;

      console.log('Uploading file for property:', property.id);
      toast({
        title: "Suksess",
        description: "Dokument lastet opp successfully",
      });

      setUploadData({ category: "other", description: "" });
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke laste opp fil",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (doc: PropertyDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('property-documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke laste ned fil",
        variant: "destructive",
      });
    }
  };

  const deleteDocument = async (doc: PropertyDocument) => {
    if (!confirm(`Er du sikker på at du vil slette "${doc.file_name}"?`)) {
      return;
    }

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('property-documents')
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('property_documents')
        .delete()
        .eq('id', doc.id);

      if (dbError) throw dbError;

      toast({
        title: "Suksess",
        description: "Dokument slettet",
      });

      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke slette dokument",
        variant: "destructive",
      });
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  }, [uploadData]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      'deed': 'Skjøte',
      'contract': 'Kontrakt',
      'insurance': 'Forsikring',
      'loan': 'Lånedokumenter',
      'tax': 'Skattedokumenter',
      'maintenance': 'Vedlikehold',
      'other': 'Annet'
    };
    return labels[category] || category;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Dokumenter - {property.address}
          </DialogTitle>
          <DialogDescription>
            Last opp og administrer dokumenter relatert til eiendommen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Last opp nytt dokument
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Kategori</Label>
                    <Select value={uploadData.category} onValueChange={(value) => setUploadData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deed">Skjøte</SelectItem>
                        <SelectItem value="contract">Kontrakt</SelectItem>
                        <SelectItem value="insurance">Forsikring</SelectItem>
                        <SelectItem value="loan">Lånedokumenter</SelectItem>
                        <SelectItem value="tax">Skattedokumenter</SelectItem>
                        <SelectItem value="maintenance">Vedlikehold</SelectItem>
                        <SelectItem value="other">Annet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">Beskrivelse</Label>
                    <Input
                      id="description"
                      value={uploadData.description}
                      onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Valgfri beskrivelse"
                    />
                  </div>
                </div>

                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">
                    Dra og slipp filer her, eller klikk for å velge
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Støtter PDF, Word, Excel, bilder og andre dokumenttyper
                  </p>
                  <Input
                    type="file"
                    className="hidden"
                    id="file-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadFile(file);
                    }}
                  />
                  <Button asChild disabled={uploading}>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {uploading ? "Laster opp..." : "Velg fil"}
                    </label>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card>
            <CardHeader>
              <CardTitle>Dokumenter ({documents.length})</CardTitle>
              <CardDescription>
                Alle dokumenter knyttet til denne eiendommen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <File className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.file_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {getCategoryLabel(doc.document_category)}
                            {doc.file_size && ` • ${formatFileSize(doc.file_size)}`}
                            {` • ${new Date(doc.uploaded_at).toLocaleDateString('no-NO')}`}
                          </p>
                          {doc.description && (
                            <p className="text-sm text-muted-foreground">{doc.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadFile(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteDocument(doc)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ingen dokumenter lastet opp ennå</p>
                  <p className="text-sm">Last opp ditt første dokument for å komme i gang</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            Lukk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};