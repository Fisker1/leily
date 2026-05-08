import AppShell from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, MessageCircle, Calendar, User, Send, XCircle } from "lucide-react";
import { leases, properties as propertiesApi, messages as messagesApi, Lease, Property, Message } from "@/api/client";
import { useState, useEffect } from "react";
import { useToast } from "@/shared/hooks/use-toast";

const fmt = (n: number) => new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 0 }).format(n);

const Kontrakter = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Lease[]>([]);
  const [props, setProps] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatLease, setChatLease] = useState<Lease | null>(null);

  const reload = () => {
    Promise.all([leases.list(), propertiesApi.list()])
      .then(([l, p]) => { setItems(l); setProps(p); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(reload, []);

  const active = items.filter(l => l.status === "active");
  const inactive = items.filter(l => l.status !== "active");

  const handleTerminate = async (id: string) => {
    if (!confirm("Avslutte denne kontrakten?")) return;
    await leases.terminate(id);
    toast({ title: "Kontrakt avsluttet" });
    reload();
  };

  if (loading) return <AppShell title="Kontrakter"><div className="space-y-4">{[1, 2].map(i => <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />)}</div></AppShell>;

  return (
    <AppShell
      title="Kontrakter"
      subtitle={`${active.length} aktive`}
      actions={
        <Button size="sm" className="h-8 px-3" onClick={() => setNewOpen(true)} disabled={props.length === 0}>
          <Plus className="h-4 w-4 mr-1" /> Ny
        </Button>
      }
    >
      {items.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ingen kontrakter</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {props.length === 0 ? "Legg til en eiendom først" : "Opprett din første leiekontrakt"}
            </p>
            {props.length > 0 && <Button onClick={() => setNewOpen(true)}><Plus className="h-4 w-4 mr-2" />Ny kontrakt</Button>}
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="active" className="text-xs">Aktive ({active.length})</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">Historikk ({inactive.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="space-y-3">
            {active.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Ingen aktive kontrakter</p>}
            {active.map(l => (
              <LeaseCard key={l.id} lease={l}
                onChat={() => { setChatLease(l); setChatOpen(true); }}
                onTerminate={() => handleTerminate(l.id)}
              />
            ))}
          </TabsContent>
          <TabsContent value="history" className="space-y-3">
            {inactive.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Ingen historikk</p>}
            {inactive.map(l => <LeaseCard key={l.id} lease={l} />)}
          </TabsContent>
        </Tabs>
      )}

      {/* New lease dialog */}
      <NewLeaseDialog open={newOpen} onOpenChange={setNewOpen} properties={props} onCreated={() => { setNewOpen(false); reload(); }} />

      {/* Chat dialog */}
      {chatLease && <ChatDialog open={chatOpen} onOpenChange={setChatOpen} lease={chatLease} />}
    </AppShell>
  );
};

// ─── Lease card ─────────────────────────────────────────
function LeaseCard({ lease, onChat, onTerminate }: { lease: Lease; onChat?: () => void; onTerminate?: () => void }) {
  const isActive = lease.status === "active";
  const daysLeft = Math.ceil((new Date(lease.end_date).getTime() - Date.now()) / 86400000);

  return (
    <Card className={!isActive ? "opacity-60" : undefined}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm truncate">{lease.property_address}</h3>
            <p className="text-xs text-muted-foreground">{lease.property_city}</p>
          </div>
          <Badge variant={isActive ? "default" : "secondary"} className="text-xs ml-2">
            {isActive ? "Aktiv" : lease.status === "terminated" ? "Avsluttet" : "Utløpt"}
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs mb-3">
          <div>
            <span className="text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" />Leietaker</span>
            <p className="font-medium mt-0.5 truncate">{lease.tenant_name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Leie</span>
            <p className="font-medium mt-0.5">{fmt(lease.monthly_rent)} kr</p>
          </div>
          <div>
            <span className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{isActive ? "Gjenstår" : "Utløp"}</span>
            <p className="font-medium mt-0.5">{isActive ? `${Math.max(daysLeft, 0)} dager` : new Date(lease.end_date).toLocaleDateString("nb-NO")}</p>
          </div>
        </div>
        {isActive && (
          <div className="flex items-center gap-2 pt-2 border-t">
            {onChat && <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={onChat}><MessageCircle className="h-3 w-3 mr-1" />Melding</Button>}
            {onTerminate && <Button variant="outline" size="sm" className="h-8 text-xs text-destructive" onClick={onTerminate}><XCircle className="h-3 w-3 mr-1" />Avslutt</Button>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── New lease dialog ───────────────────────────────────
function NewLeaseDialog({ open, onOpenChange, properties, onCreated }: {
  open: boolean; onOpenChange: (o: boolean) => void; properties: Property[]; onCreated: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [propertyId, setPropertyId] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await leases.create({
        property_id: propertyId,
        tenant_first_name: fd.get("first_name") as string,
        tenant_last_name: fd.get("last_name") as string,
        tenant_email: fd.get("email") as string,
        tenant_phone: fd.get("phone") as string,
        monthly_rent: Number(fd.get("monthly_rent")),
        deposit: Number(fd.get("deposit")) || 0,
        start_date: fd.get("start_date") as string,
        end_date: fd.get("end_date") as string,
      });
      toast({ title: "Kontrakt opprettet" });
      onCreated();
    } catch (err: any) {
      toast({ title: "Feil", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Ny kontrakt</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Eiendom</Label>
            <Select value={propertyId} onValueChange={setPropertyId} required>
              <SelectTrigger className="h-9"><SelectValue placeholder="Velg eiendom" /></SelectTrigger>
              <SelectContent>
                {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.address}, {p.city}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Leietaker</p>
            <div className="grid grid-cols-2 gap-3">
              <F label="Fornavn" name="first_name" required />
              <F label="Etternavn" name="last_name" required />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <F label="E-post" name="email" type="email" />
              <F label="Telefon" name="phone" />
            </div>
          </div>
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Kontraktdetaljer</p>
            <F label="Månedlig leie (kr)" name="monthly_rent" type="number" required />
            <F label="Depositum (kr)" name="deposit" type="number" />
            <div className="grid grid-cols-2 gap-3">
              <F label="Startdato" name="start_date" type="date" required />
              <F label="Sluttdato" name="end_date" type="date" required />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={saving || !propertyId}>
            {saving ? "Oppretter..." : "Opprett kontrakt"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Chat dialog ────────────────────────────────────────
function ChatDialog({ open, onOpenChange, lease }: { open: boolean; onOpenChange: (o: boolean) => void; lease: Lease }) {
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open && lease.id) {
      messagesApi.list(lease.id).then(setMsgs).catch(console.error);
    }
  }, [open, lease.id]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    const msg = await messagesApi.send(lease.id, text.trim());
    setMsgs(prev => [...prev, msg]);
    setText("");
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm flex flex-col h-[70vh]">
        <DialogHeader>
          <DialogTitle className="text-sm">Meldinger — {lease.tenant_name}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-2 py-2">
          {msgs.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Ingen meldinger ennå</p>}
          {msgs.map(m => (
            <div key={m.id} className={`flex ${m.sender === "landlord" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.sender === "landlord" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <p>{m.content}</p>
                <p className="text-[10px] opacity-70 mt-1">{new Date(m.created_at).toLocaleDateString("nb-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Skriv melding..." className="min-h-[40px] h-10 resize-none" onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
          <Button size="sm" className="h-10 px-3" onClick={handleSend} disabled={sending || !text.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function F({ label, name, type, required, defaultValue }: { label: string; name: string; type?: string; required?: boolean; defaultValue?: any }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name} className="text-xs">{label}</Label>
      <Input id={name} name={name} type={type || "text"} defaultValue={defaultValue ?? ""} required={required} className="h-9" />
    </div>
  );
}

export default Kontrakter;
