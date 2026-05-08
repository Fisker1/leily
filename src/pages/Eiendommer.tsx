import AppShell from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, MapPin, Bed, Ruler, Eye, Edit, Trash2 } from "lucide-react";
import { properties, Property } from "@/api/client";
import { useState, useEffect } from "react";
import { useToast } from "@/shared/hooks/use-toast";

const fmt = (n: number) =>
  new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 0 }).format(n);

const Eiendommer = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Property | null>(null);

  const reload = () => {
    properties.list().then(setItems).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(reload, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Slette denne eiendommen?")) return;
    await properties.remove(id);
    toast({ title: "Slettet" });
    reload();
  };

  if (loading) {
    return (
      <AppShell title="Eiendommer">
        <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Eiendommer"
      subtitle={`${items.length} registrert`}
      actions={
        <Button size="sm" className="h-8 px-3" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Ny
        </Button>
      }
    >
      {items.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ingen eiendommer ennå</h3>
            <p className="text-sm text-muted-foreground mb-4">Legg til din første eiendom</p>
            <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-2" />Legg til</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map(p => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm truncate">{p.address}</h3>
                    <p className="text-xs text-muted-foreground">{[p.postal_code, p.city].filter(Boolean).join(" ")}</p>
                  </div>
                  <Badge variant={p.active_lease ? "default" : "secondary"} className="text-xs ml-2">
                    {p.active_lease ? "Utleid" : "Ledig"}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  {p.property_type && <span>{p.property_type}</span>}
                  {p.size_sqm && <span className="flex items-center gap-1"><Ruler className="h-3 w-3" />{p.size_sqm} m²</span>}
                  {p.bedrooms && <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{p.bedrooms}</span>}
                </div>

                {p.active_lease ? (
                  <div className="bg-primary/5 rounded-lg p-3 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Leie</span>
                      <span className="font-semibold text-primary">{fmt(p.active_lease.monthly_rent)} kr/mnd</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-muted-foreground">{p.active_lease.tenant_name}</span>
                      <span className="text-muted-foreground">til {new Date(p.active_lease.end_date).toLocaleDateString("nb-NO")}</span>
                    </div>
                  </div>
                ) : p.monthly_rent ? (
                  <div className="bg-muted/50 rounded-lg p-3 mb-3 flex justify-between text-sm">
                    <span className="text-muted-foreground">Forventet leie</span>
                    <span className="font-medium">{fmt(p.monthly_rent)} kr/mnd</span>
                  </div>
                ) : null}

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setSelected(p); setEditOpen(true); }}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add dialog */}
      <PropertyFormDialog open={addOpen} onOpenChange={setAddOpen} onSave={async (data) => {
        await properties.create(data);
        toast({ title: "Eiendom lagt til" });
        setAddOpen(false);
        reload();
      }} />

      {/* Edit dialog */}
      {selected && (
        <PropertyFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          initial={selected}
          onSave={async (data) => {
            await properties.update(selected.id, data);
            toast({ title: "Oppdatert" });
            setEditOpen(false);
            reload();
          }}
        />
      )}
    </AppShell>
  );
};

// ─── Reusable property form dialog ───────────────────────
function PropertyFormDialog({
  open, onOpenChange, initial, onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: Partial<Property>;
  onSave: (data: Partial<Property>) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const data: Partial<Property> = {
      address: fd.get("address") as string,
      city: fd.get("city") as string,
      postal_code: fd.get("postal_code") as string,
      property_type: fd.get("property_type") as string || "Leilighet",
      size_sqm: Number(fd.get("size_sqm")) || undefined,
      bedrooms: Number(fd.get("bedrooms")) || undefined,
      purchase_price: Number(fd.get("purchase_price")) || undefined,
      current_value: Number(fd.get("current_value")) || undefined,
      loan_amount: Number(fd.get("loan_amount")) || undefined,
      interest_rate: Number(fd.get("interest_rate")) || undefined,
      monthly_rent: Number(fd.get("monthly_rent")) || undefined,
    };
    try {
      await onSave(data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Rediger eiendom" : "Ny eiendom"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Adresse" name="address" defaultValue={initial?.address} required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Postnr" name="postal_code" defaultValue={initial?.postal_code} />
            <Field label="By" name="city" defaultValue={initial?.city} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type" name="property_type" defaultValue={initial?.property_type || "Leilighet"} />
            <Field label="Soverom" name="bedrooms" type="number" defaultValue={initial?.bedrooms} />
          </div>
          <Field label="Størrelse (m²)" name="size_sqm" type="number" defaultValue={initial?.size_sqm} />
          <Field label="Kjøpspris (kr)" name="purchase_price" type="number" defaultValue={initial?.purchase_price} />
          <Field label="Nåverdi (kr)" name="current_value" type="number" defaultValue={initial?.current_value} />
          <Field label="Lån (kr)" name="loan_amount" type="number" defaultValue={initial?.loan_amount} />
          <Field label="Rente (%)" name="interest_rate" type="number" defaultValue={initial?.interest_rate} step="0.1" />
          <Field label="Månedlig leie (kr)" name="monthly_rent" type="number" defaultValue={initial?.monthly_rent} />
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Lagrer..." : initial ? "Oppdater" : "Legg til"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, name, defaultValue, type, required, step }: {
  label: string; name: string; defaultValue?: any; type?: string; required?: boolean; step?: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name} className="text-xs">{label}</Label>
      <Input id={name} name={name} type={type || "text"} defaultValue={defaultValue ?? ""} required={required} step={step} className="h-9" />
    </div>
  );
}

export default Eiendommer;
