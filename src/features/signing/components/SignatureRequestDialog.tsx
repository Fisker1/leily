import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileSignature, AlertCircle } from "lucide-react";
import { supabase } from "@/shared/integrations/supabase/client";
import { toast } from "sonner";

interface SignatureRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaseId: string;
  propertyAddress: string;
  tenantName: string;
  onSuccess?: (data: Record<string, unknown>) => void;
}

const formSchema = z.object({
  confirmInfo: z.boolean().refine((val) => val === true, {
    message: "Du må bekrefte at informasjonen er korrekt",
  }),
  confirmLegal: z.boolean().refine((val) => val === true, {
    message: "Du må akseptere de juridiske vilkårene",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function SignatureRequestDialog({
  open,
  onOpenChange,
  leaseId,
  propertyAddress,
  tenantName,
  onSuccess,
}: SignatureRequestDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      confirmInfo: false,
      confirmLegal: false,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);

    try {
      console.log("Initiating signature request for lease:", leaseId);

      // Call Edge Function to create signature request
      const { data: result, error } = await supabase.functions.invoke(
        'signicat-signing/create-signature-request',
        {
          body: { leaseId },
        }
      );

      if (error) {
        throw error;
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to create signature request');
      }

      toast.success('Signeringsforespørsel opprettet!', {
        description: 'Du vil nå bli videresendt til BankID for signering.',
      });

      // Send notification to tenant
      try {
        await supabase.functions.invoke('send-lease-notification/email', {
          body: {
            signatureId: result.signatureId,
            recipientType: 'tenant',
          },
        });
        console.log('Tenant notification sent');
      } catch (notifError) {
        console.error('Failed to send tenant notification:', notifError);
        // Don't fail the whole process if notification fails
      }

      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }

      // Redirect landlord to signing URL
      if (result.landlordSigningUrl) {
        setTimeout(() => {
          window.location.href = result.landlordSigningUrl;
        }, 1000);
      }

      onOpenChange(false);
    } catch (error: unknown) {
      console.error('Error creating signature request:', error);
      toast.error('Kunne ikke opprette signeringsforespørsel', {
        description: (error as Error).message || 'Prøv igjen senere',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            <DialogTitle>Send til BankID-signering</DialogTitle>
          </div>
          <DialogDescription>
            Leieavtalen vil bli sendt til {tenantName} for signering med BankID
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Viktig informasjon om signering:</strong>
                <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                  <li>Du vil først signere avtalen med din BankID</li>
                  <li>{tenantName} får deretter e-post med lenke for å signere</li>
                  <li>Avtalen er juridisk bindende når begge har signert</li>
                  <li>Signeringsforespørselen er gyldig i 30 dager</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="confirmInfo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Jeg bekrefter at all informasjon i leieavtalen er korrekt
                      </FormLabel>
                      <FormDescription>
                        Du kan ikke endre avtalen etter signering
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmLegal"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Jeg forstår at dette er en juridisk bindende avtale
                      </FormLabel>
                      <FormDescription>
                        Avtalen følger norsk husleielov
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Avbryt
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Sender...
                  </>
                ) : (
                  <>
                    <FileSignature className="mr-2 h-4 w-4" />
                    Send til signering
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
