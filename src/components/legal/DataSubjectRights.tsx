import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Download, Trash2, Edit, Eye, AlertCircle } from "lucide-react";

const DataSubjectRights = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [requestType, setRequestType] = useState("");
  const [description, setDescription] = useState("");

  const handleDataRequest = async (type: string) => {
    if (!user) {
      toast({
        title: "Feil",
        description: "Du må være logget inn for å gjøre denne handlingen.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Log the request
      const { error } = await (supabase as any)
        .from('data_subject_requests')
        .insert({
          user_id: user.id,
          request_type: type,
          description: description || null,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Forespørsel sendt",
        description: "Vi har mottatt din forespørsel og vil behandle den innen 30 dager som påkrevd av GDPR.",
      });

      setDescription("");
      setRequestType("");
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke sende forespørsel. Prøv igjen eller kontakt support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDataExport = async () => {
    if (!user) return;

    setLoading(true);
    
    try {
      // Fetch user's data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: properties } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id);

      const { data: reports } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id);

      const exportData = {
        profile,
        properties,
        reports,
        exportDate: new Date().toISOString(),
        requestedBy: user.email
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leily-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log the export
      await (supabase as any)
        .from('data_subject_requests')
        .insert({
          user_id: user.id,
          request_type: 'export',
          description: 'Data export completed',
          status: 'completed'
        });

      toast({
        title: "Data eksportert",
        description: "Dine personopplysninger er lastet ned som JSON-fil.",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke eksportere data. Prøv igjen senere.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const rights = [
    {
      icon: Eye,
      title: "Innsyn",
      description: "Se hvilke personopplysninger vi har om deg",
      action: () => handleDataRequest('access'),
      immediate: false
    },
    {
      icon: Download,
      title: "Dataportabilitet", 
      description: "Last ned dine personopplysninger i maskinlesbart format",
      action: handleDataExport,
      immediate: true
    },
    {
      icon: Edit,
      title: "Retting",
      description: "Be om å korrigere feil i dine personopplysninger",
      action: () => handleDataRequest('rectification'),
      immediate: false
    },
    {
      icon: Trash2,
      title: "Sletting",
      description: "Be om å få slettet dine personopplysninger",
      action: () => handleDataRequest('deletion'),
      immediate: false
    },
    {
      icon: AlertCircle,
      title: "Begrensning",
      description: "Be om å begrense behandlingen av dine data",
      action: () => handleDataRequest('restriction'),
      immediate: false
    },
    {
      icon: AlertCircle,
      title: "Innsigelse",
      description: "Protestere mot behandling av dine personopplysninger",
      action: () => handleDataRequest('objection'),
      immediate: false
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Dine personvernrettigheter</h1>
        <p className="text-muted-foreground">
          I henhold til GDPR har du flere rettigheter når det gjelder dine personopplysninger.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {rights.map((right, index) => (
          <Card key={index} className="relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <right.icon className="h-5 w-5 text-primary" />
                {right.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{right.description}</p>
              
              {!right.immediate && (
                <div className="space-y-2">
                  <Label htmlFor={`desc-${index}`}>Beskriv din forespørsel (valgfritt)</Label>
                  <Textarea
                    id={`desc-${index}`}
                    placeholder="Gi oss mer informasjon om din forespørsel..."
                    value={requestType === right.title.toLowerCase() ? description : ""}
                    onChange={(e) => {
                      setRequestType(right.title.toLowerCase());
                      setDescription(e.target.value);
                    }}
                    rows={3}
                  />
                </div>
              )}

              <Button 
                onClick={right.action}
                disabled={loading}
                className="w-full"
                variant={right.title === "Sletting" ? "destructive" : "default"}
              >
                {loading && requestType === right.title.toLowerCase() ? "Behandler..." : 
                 right.immediate ? `${right.title} nå` : `Send ${right.title.toLowerCase()}sforespørsel`}
              </Button>

              {!right.immediate && (
                <p className="text-xs text-muted-foreground">
                  Vi vil behandle din forespørsel innen 30 dager og kontakte deg via e-post.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Kontakt oss direkte</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Har du spørsmål om personvern eller ønsker å utøve rettighetene dine på en annen måte?
          </p>
          <div className="space-y-2">
            <p className="text-sm"><strong>E-post:</strong> personvern@leily.no</p>
            <p className="text-sm"><strong>Telefon:</strong> +47 123 45 678</p>
            <p className="text-sm"><strong>Postadresse:</strong> Leily AS, Postboks 123, 0123 Oslo</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataSubjectRights;