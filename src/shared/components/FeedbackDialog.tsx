import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { supabase } from "@/shared/integrations/supabase/client";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FeedbackDialog = ({ open, onOpenChange }: FeedbackDialogProps) => {
  const { translations } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Vennligst fyll ut alle feltene");
      return;
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Vennligst oppgi en gyldig e-postadresse");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('send-leily-email', {
        body: {
          to: 'kontakt@leily.no',
          subject: `Tilbakemelding fra ${name}`,
          html: `<p><strong>Navn:</strong> ${name}</p><p><strong>E-post:</strong> ${email}</p><p><strong>Melding:</strong></p><p>${message}</p>`,
          replyTo: email,
        },
      });

      if (error) throw error;

      toast.success("Takk for din tilbakemelding!");
      setName("");
      setEmail("");
      setMessage("");
      onOpenChange(false);
    } catch (err) {
      console.error("Feedback submission error:", err);
      toast.error("Kunne ikke sende melding. Prøv igjen senere.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Kontakt & Tilbakemeldinger</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-[300px_1fr] gap-6 h-full">
          {/* Kontaktinformasjon - Venstre side */}
          <div className="bg-muted/50 p-6 rounded-lg space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-4">Kontaktinformasjon</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">E-post</p>
                    <a href="mailto:kontakt@leily.no" className="text-sm text-muted-foreground hover:text-primary">
                      kontakt@leily.no
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Telefon</p>
                    <a href="tel:+4712345678" className="text-sm text-muted-foreground hover:text-primary">
                      +47 123 45 678
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Adresse</p>
                    <p className="text-sm text-muted-foreground">
                      Oslo, Norge
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Vi svarer normalt innen 24 timer på hverdager.
              </p>
            </div>
          </div>

          {/* Chat/Melding - Høyre side */}
          <div className="flex flex-col gap-4">
            <div className="space-y-4 flex-1">
              <div>
                <Label htmlFor="name">Navn</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ditt navn"
                />
              </div>

              <div>
                <Label htmlFor="email">E-post</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@epost.no"
                />
              </div>

              <div className="flex-1">
                <Label htmlFor="message">Melding</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Skriv din melding eller tilbakemelding her..."
                  className="min-h-[200px] resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? "Sender..." : "Send melding"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;
