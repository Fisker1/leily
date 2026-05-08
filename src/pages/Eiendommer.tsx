import AppShell from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Bed, Ruler, Eye, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/shared/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import { formatNumberWithSpaces } from "@/shared/lib/utils";
import PropertyImage from "@/features/property/components/PropertyImage";
import { PropertyAddDialog } from "@/features/property/components/PropertyAddDialog";
import { PropertyEditDialog } from "@/features/property/components/PropertyEditDialog";
import { PropertyDetailsDialog } from "@/features/property/components/PropertyDetailsDialog";
import { PropertyDocumentsDialog } from "@/features/property/components/PropertyDocumentsDialog";

interface Property {
  id: string;
  address: string;
  city?: string;
  postal_code?: string;
  property_type?: string;
  size_sqm?: number;
  bedrooms?: number;
  purchase_price?: number;
  current_value?: number;
  monthly_rent?: number;
  image_url?: string;
  owner_id: string;
  created_at?: string;
  active_lease?: {
    id: string;
    tenant_name: string;
    monthly_rent: number;
    end_date: string;
  } | null;
}

const Eiendommer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);

  useEffect(() => {
    if (user) fetchProperties();
  }, [user]);

  const fetchProperties = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch active leases for each property
      const propsWithLeases = await Promise.all(
        (data || []).map(async (prop) => {
          const { data: leases } = await supabase
            .from("lease_agreements")
            .select("id, monthly_rent, end_date, tenant_id")
            .eq("property_id", prop.id)
            .eq("status", "active")
            .limit(1);

          let activeLease = null;
          if (leases && leases.length > 0) {
            const { data: tenant } = await supabase
              .from("tenants")
              .select("first_name, last_name")
              .eq("id", leases[0].tenant_id)
              .single();

            activeLease = {
              id: leases[0].id,
              tenant_name: tenant ? `${tenant.first_name} ${tenant.last_name}` : "Ukjent",
              monthly_rent: leases[0].monthly_rent,
              end_date: leases[0].end_date,
            };
          }

          return { ...prop, active_lease: activeLease } as Property;
        })
      );

      setProperties(propsWithLeases);
    } catch (err) {
      console.error("Error fetching properties:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Er du sikker på at du vil slette denne eiendommen?")) return;

    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) {
      toast({ title: "Feil", description: "Kunne ikke slette eiendommen", variant: "destructive" });
    } else {
      toast({ title: "Slettet", description: "Eiendommen er fjernet" });
      fetchProperties();
    }
  };

  if (loading) {
    return (
      <AppShell title="Eiendommer">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Eiendommer"
      subtitle={`${properties.length} registrert`}
      actions={
        <PropertyAddDialog onPropertyAdded={fetchProperties}>
          <Button size="sm" className="bg-primary text-primary-foreground h-8 px-3">
            <Plus className="h-4 w-4 mr-1" />
            Ny
          </Button>
        </PropertyAddDialog>
      }
    >
      {properties.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ingen eiendommer ennå</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Legg til din første eiendom for å komme i gang
            </p>
            <PropertyAddDialog onPropertyAdded={fetchProperties}>
              <Button className="bg-primary text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Legg til eiendom
              </Button>
            </PropertyAddDialog>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {properties.map(property => (
            <Card key={property.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Image + overlay */}
                <div className="relative h-36">
                  <PropertyImage
                    imageUrl={property.image_url}
                    address={property.address}
                    city={property.city}
                    className="w-full h-full object-cover"
                    alt={property.address}
                  />
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant={property.active_lease ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {property.active_lease ? "Utleid" : "Ledig"}
                    </Badge>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-sm mb-1 truncate">
                    {property.address}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {[property.postal_code, property.city].filter(Boolean).join(" ")}
                  </p>

                  {/* Quick stats */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    {property.property_type && (
                      <span>{property.property_type}</span>
                    )}
                    {property.size_sqm && (
                      <span className="flex items-center gap-1">
                        <Ruler className="h-3 w-3" />
                        {property.size_sqm} m²
                      </span>
                    )}
                    {property.bedrooms && (
                      <span className="flex items-center gap-1">
                        <Bed className="h-3 w-3" />
                        {property.bedrooms}
                      </span>
                    )}
                  </div>

                  {/* Rent / tenant info */}
                  {property.active_lease ? (
                    <div className="bg-primary/5 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Leie</span>
                        <span className="font-semibold text-primary">
                          {formatNumberWithSpaces(property.active_lease.monthly_rent)} kr/mnd
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-muted-foreground">{property.active_lease.tenant_name}</span>
                        <span className="text-muted-foreground">
                          til {new Date(property.active_lease.end_date).toLocaleDateString("nb-NO")}
                        </span>
                      </div>
                    </div>
                  ) : property.monthly_rent ? (
                    <div className="bg-muted/50 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Forventet leie</span>
                        <span className="font-medium">
                          {formatNumberWithSpaces(property.monthly_rent)} kr/mnd
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => { setSelectedProperty(property); setDetailsOpen(true); }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Detaljer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => { setSelectedProperty(property); setDocumentsOpen(true); }}
                    >
                      Dokumenter
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => { setSelectedProperty(property); setEditOpen(true); }}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(property.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      {selectedProperty && (
        <>
          <PropertyEditDialog
            property={selectedProperty}
            open={editOpen}
            onOpenChange={setEditOpen}
            onPropertyUpdated={fetchProperties}
          />
          <PropertyDetailsDialog
            property={selectedProperty}
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
          />
          <PropertyDocumentsDialog
            property={selectedProperty}
            open={documentsOpen}
            onOpenChange={setDocumentsOpen}
          />
        </>
      )}
    </AppShell>
  );
};

export default Eiendommer;
