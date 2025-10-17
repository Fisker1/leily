import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ScriveDocumentRequest {
  lease_agreement_id: string;
  landlord_email: string;
  landlord_name: string;
  tenant_email: string;
  tenant_name: string;
  property_address: string;
  document_pdf_url?: string;
}

export interface SigningDocument {
  id: string;
  lease_agreement_id: string;
  scrive_document_id: string;
  document_type: string;
  status: string;
  title: string;
  message: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  lease_agreement?: {
    id: string;
    monthly_rent: number;
    start_date: string;
    end_date?: string;
    property?: {
      address: string;
      city: string;
    };
    tenant?: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
  signers?: DocumentSigner[];
}

export interface DocumentSigner {
  id: string;
  document_id: string;
  user_id?: string;
  signer_email: string;
  signer_name: string;
  signer_role: string;
  status: string;
  signed_at?: string;
  declined_at?: string;
  decline_reason?: string;
  created_at: string;
  updated_at: string;
}

export const useScriveSigning = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<SigningDocument[]>([]);

  const callScriveAPI = useCallback(async (action: string, data?: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }

    const url = new URL(`${supabase.supabaseUrl}/functions/v1/scrive-signing`);
    url.searchParams.set('action', action);

    const response = await fetch(url.toString(), {
      method: data ? 'POST' : 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'API call failed');
    }

    return await response.json();
  }, []);

  const createDocument = useCallback(async (request: ScriveDocumentRequest) => {
    setLoading(true);
    try {
      const result = await callScriveAPI('create-document', request);
      
      toast({
        title: "Dokument opprettet",
        description: "Signeringsdokumentet er opprettet og klar for signering"
      });

      return result;
    } catch (error) {
      console.error('Error creating document:', error);
      toast({
        title: "Feil ved opprettelse",
        description: error instanceof Error ? error.message : 'Kunne ikke opprette dokument',
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [callScriveAPI, toast]);

  const uploadFile = useCallback(async (documentId: string, file: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('document_id', documentId);
      formData.append('file', file);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const url = new URL(`${supabase.supabaseUrl}/functions/v1/scrive-signing`);
      url.searchParams.set('action', 'upload-file');

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      toast({
        title: "Fil lastet opp",
        description: "PDF-dokumentet er lastet opp til signeringssystemet"
      });

      return result;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Feil ved opplasting",
        description: error instanceof Error ? error.message : 'Kunne ikke laste opp fil',
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const sendDocument = useCallback(async (documentId: string, message?: string) => {
    setLoading(true);
    try {
      const result = await callScriveAPI('send-document', {
        document_id: documentId,
        message: message || 'Leieavtale klar for signering'
      });
      
      toast({
        title: "Dokument sendt",
        description: "Signeringsdokumentet er sendt til alle parter"
      });

      return result;
    } catch (error) {
      console.error('Error sending document:', error);
      toast({
        title: "Feil ved sending",
        description: error instanceof Error ? error.message : 'Kunne ikke sende dokument',
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [callScriveAPI, toast]);

  const getDocumentStatus = useCallback(async (documentId: string) => {
    try {
      const result = await callScriveAPI('document-status', { document_id: documentId });
      return result;
    } catch (error) {
      console.error('Error getting document status:', error);
      throw error;
    }
  }, [callScriveAPI]);

  const getDocumentList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await callScriveAPI('document-list');
      setDocuments(result.documents || []);
      return result.documents || [];
    } catch (error) {
      console.error('Error getting document list:', error);
      toast({
        title: "Feil ved henting",
        description: error instanceof Error ? error.message : 'Kunne ikke hente dokumenter',
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [callScriveAPI, toast]);

  const refreshDocumentStatus = useCallback(async (documentId: string) => {
    try {
      const result = await getDocumentStatus(documentId);
      
      // Update local documents state
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, status: result.status }
          : doc
      ));

      return result;
    } catch (error) {
      console.error('Error refreshing document status:', error);
      throw error;
    }
  }, [getDocumentStatus]);

  const getSigningUrl = useCallback((documentId: string, signerEmail: string) => {
    // This would typically come from Scrive API response
    // For now, we'll construct a placeholder URL
    return `https://app.scrive.com/sign/${documentId}?email=${encodeURIComponent(signerEmail)}`;
  }, []);

  const cancelDocument = useCallback(async (documentId: string) => {
    setLoading(true);
    try {
      // Update status in database
      const { error } = await supabase
        .from('signing_documents')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (error) {
        throw new Error(error.message);
      }

      // Update local state
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, status: 'cancelled' }
          : doc
      ));

      toast({
        title: "Dokument kansellert",
        description: "Signeringsdokumentet er kansellert"
      });

    } catch (error) {
      console.error('Error cancelling document:', error);
      toast({
        title: "Feil ved kansellering",
        description: error instanceof Error ? error.message : 'Kunne ikke kansellere dokument',
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    documents,
    createDocument,
    uploadFile,
    sendDocument,
    getDocumentStatus,
    getDocumentList,
    refreshDocumentStatus,
    getSigningUrl,
    cancelDocument
  };
};




