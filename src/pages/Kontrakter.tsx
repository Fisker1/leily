import AppShell from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText, MessageCircle, PenTool, Calendar, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/shared/integrations/supabase/client";
import { useState, useEffect } from "react";
import { formatNumberWithSpaces } from "@/shared/lib/utils";
import RentalAgreementDialog from "@/features/rental/components/RentalAgreementDialog";
import TenantChatDialog from "@/features/rental/components/TenantChatDialog";
import TransferProtocolDialog from "@/features/rental/components/TransferProtocolDialog";

interface Lease {
  id: string;
  property_id: string;
  tenant_id: string;
  monthly_rent: number;
  start_date: string;
  end_date: string;
  status: string;
  signature_status?: string;
  property_address?: string;
  property_city?: string;
  tenant_name?: string;
}

interface PropertyOption {
  id: string;
  address: string;
  city?: string;
  size_sqm?: number;
}

const Kontrakter = () => {
  const { user } = useAuth();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLeaseOpen, setNewLeaseOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      // Fetch leases
      const { data: leaseData } = await supabase
        .from("lease_agreements")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      // Fetch properties for the dialog
      const { data: propData } = await supabase
        .from("properties")
        .select("id, address, city, size_sqm")
        .eq("owner_id", user.id);

      // Enrich leases with property & tenant names
      const enriched = await Promise.all(
        (leaseData || []).map(async (lease) => {
          const prop = propData?.find(p => p.id === lease.property_id);
          let tenantName = "Ukjent";
          if (lease.tenant_id) {
            const { data: tenant } = await supabase
              .from("tenants")
              .select("first_name, last_name")
              .eq("id", lease.tenant_id)
              .single();
            if (tenant) tenantName = `${tenant.first_name} ${tenant.last_name}`;
          }
          return {
            ...lease,
            property_address: prop?.address || "Ukjent",
            property_city: prop?.city || "",
            tenant_name: tenantName,
          };
        })
      );

      setLeases(enriched);
      setProperties(propData || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const activeLeases = leases.filter(l => l.status === "active");
  const inactiveLeases = leases.filter(l => l.status !== "active");

  if (loading) {
    return (
      <AppShell title="Kontrakter">
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />)}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Kontrakter"
      subtitle={`${activeLeases.length} aktive`}
      actions={
        <Button
          size="sm"
          className="bg-primary text-primary-foreground h-8 px-3"
          onClick={() => setNewLeaseOpen(true)}
          disabled={properties.length === 0}
        >
          <Plus className="h-4 w-4 mr-1" />
          Ny
        </Button>
      }
    >
      {leases.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ingen kontrakter</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {properties.length === 0
                ? "Legg til en eiendom først, deretter kan du opprette kontrakter"
                : "Opprett din første leiekontrakt"}
            </p>
            {properties.length > 0 && (
              <Button
                className="bg-primary text-primary-foreground"
                onClick={() => setNewLeaseOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ny kontrakt
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="active" className="text-xs">
              Aktive ({activeLeases.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs">
              Historikk ({inactiveLeases.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3 mt-3">
            {activeLeases.map(lease => (
              <LeaseCard
                key={lease.id}
                lease={lease}
                onChat={() => { setSelectedLease(lease); setChatOpen(true); }}
                onTransfer={() => { setSelectedLease(lease); setTransferOpen(true); }}
              />
            ))}
            {activeLeases.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Ingen aktive kontrakter
              </p>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-3 mt-3">
            {inactiveLeases.map(lease => (
              <LeaseCard key={lease.id} lease={lease} />
            ))}
            {inactiveLeases.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Ingen historikk ennå
              </p>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Dialogs */}
      <RentalAgreementDialog
        open={newLeaseOpen}
        onOpenChange={setNewLeaseOpen}
        properties={properties}
        onPropertyAdded={fetchData}
      />

      {selectedLease && (
        <>
          <TenantChatDialog
            open={chatOpen}
            onOpenChange={setChatOpen}
            property={{ id: selectedLease.property_id, address: selectedLease.property_address }}
            lease={{ id: selectedLease.id, monthly_rent: selectedLease.monthly_rent }}
            tenant={{ name: selectedLease.tenant_name }}
          />
          <TransferProtocolDialog
            open={transferOpen}
            onOpenChange={setTransferOpen}
            leaseId={selectedLease.id}
            propertyAddress={selectedLease.property_address || ""}
            tenantName={selectedLease.tenant_name || ""}
            protocolType="move_in"
          />
        </>
      )}
    </AppShell>
  );
};

function LeaseCard({
  lease,
  onChat,
  onTransfer,
}: {
  lease: Lease;
  onChat?: () => void;
  onTransfer?: () => void;
}) {
  const isActive = lease.status === "active";
  const daysLeft = Math.ceil(
    (new Date(lease.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className={!isActive ? "opacity-60" : undefined}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm truncate">{lease.property_address}</h3>
            <p className="text-xs text-muted-foreground">{lease.property_city}</p>
          </div>
          <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
            <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
              {isActive ? "Aktiv" : "Utløpt"}
            </Badge>
            {lease.signature_status && (
              <Badge
                variant="outline"
                className={
                  lease.signature_status === "fully_signed"
                    ? "text-green-700 border-green-300 text-xs"
                    : "text-yellow-700 border-yellow-300 text-xs"
                }
              >
                {lease.signature_status === "fully_signed" ? "Signert" : "Venter"}
              </Badge>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-3 gap-3 text-xs mb-3">
          <div>
            <span className="text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" />
              Leietaker
            </span>
            <p className="font-medium mt-0.5 truncate">{lease.tenant_name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Leie</span>
            <p className="font-medium mt-0.5">{formatNumberWithSpaces(lease.monthly_rent)} kr</p>
          </div>
          <div>
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {isActive ? "Gjenstår" : "Utløp"}
            </span>
            <p className="font-medium mt-0.5">
              {isActive
                ? `${daysLeft > 0 ? daysLeft : 0} dager`
                : new Date(lease.end_date).toLocaleDateString("nb-NO")}
            </p>
          </div>
        </div>

        {/* Actions */}
        {isActive && (onChat || onTransfer) && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            {onChat && (
              <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={onChat}>
                <MessageCircle className="h-3 w-3 mr-1" />
                Melding
              </Button>
            )}
            {onTransfer && (
              <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={onTransfer}>
                <PenTool className="h-3 w-3 mr-1" />
                Overlevering
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default Kontrakter;
