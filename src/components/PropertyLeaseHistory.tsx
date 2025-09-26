import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Users, FileText, Camera, Building, CreditCard, Eye, Plus, History } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import TransferProtocolDialog from './TransferProtocolDialog';

interface Room {
  roomName: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
  damages?: string[];
  photoUrls?: string[];
}

interface PropertyLeaseHistoryProps {
  propertyId: string;
  propertyAddress: string;
}

interface LeaseAgreement {
  id: string;
  tenant_id: string;
  monthly_rent: number;
  deposit_amount: number | null;
  start_date: string;
  end_date: string | null;
  status: string;
  created_at: string;
  tenant: {
    first_name: string;
    last_name: string;
  };
  deposit_accounts: DepositAccount[];
  transfer_protocols: TransferProtocol[];
}

interface DepositAccount {
  id: string;
  deposit_amount: number;
  interest_rate: number | null;
  bank_name: string | null;
  status: string | null;
  created_at: string;
}

interface TransferProtocol {
  id: string;
  protocol_type: string;
  protocol_date: string;
  condition_notes: string | null;
  damages: string | null;
  repairs_needed: string | null;
  signatures_completed: boolean | null;
  photos_urls: string[] | null;
  created_at: string;
}

const PropertyLeaseHistory = ({ propertyId, propertyAddress }: PropertyLeaseHistoryProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [leases, setLeases] = useState<LeaseAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLease, setSelectedLease] = useState<LeaseAgreement | null>(null);
  const [transferProtocolDialogOpen, setTransferProtocolDialogOpen] = useState(false);
  const [protocolType, setProtocolType] = useState<'move_in' | 'move_out'>('move_in');

  useEffect(() => {
    fetchLeaseHistory();
  }, [propertyId]);

  const fetchLeaseHistory = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('lease_agreements')
        .select(`
          *,
          deposit_accounts(*),
          transfer_protocols(*)
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Get tenant information separately due to encryption
      const leasesWithTenants = await Promise.all(
        (data || []).map(async (lease) => {
          try {
            // Use the secure function to get tenant data
            const { data: tenantData, error: tenantError } = await supabase
              .rpc('get_secure_tenant_data', { tenant_property_owner_id: user?.id })
              .eq('id', lease.tenant_id)
              .single();

            if (tenantError) {
              console.error('Error fetching tenant data:', tenantError);
              return {
                ...lease,
                tenant: { first_name: 'Ukjent', last_name: 'Leietaker' }
              };
            }

            return {
              ...lease,
              tenant: {
                first_name: tenantData?.first_name || 'Ukjent',
                last_name: tenantData?.last_name || 'Leietaker'
              }
            };
          } catch (error) {
            console.error('Error processing lease:', error);
            return {
              ...lease,
              tenant: { first_name: 'Ukjent', last_name: 'Leietaker' }
            };
          }
        })
      );

      setLeases(leasesWithTenants);
    } catch (error) {
      console.error('Error fetching lease history:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke hente leiehistorikk",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'ended': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'terminated': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'ended': return 'Avsluttet';
      case 'terminated': return 'Oppsagt';
      default: return 'Ukjent';
    }
  };

  const handleCreateTransferProtocol = (lease: LeaseAgreement, type: 'move_in' | 'move_out') => {
    setSelectedLease(lease);
    setProtocolType(type);
    setTransferProtocolDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Leiehistorikk
          </CardTitle>
          <CardDescription>
            Oversikt over alle leieforhold for {propertyAddress}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ingen leieforhold registrert for denne eiendommen</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leases.map((lease) => (
                <Card key={lease.id} className="border-l-4 border-l-primary/20">
                  <CardContent className="pt-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {lease.tenant.first_name} {lease.tenant.last_name}
                            </span>
                          </div>
                          <Badge className={getStatusColor(lease.status)}>
                            {getStatusText(lease.status)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Periode:</span>
                            <div className="font-medium">
                              {format(new Date(lease.start_date), "MMM yyyy", { locale: nb })}
                              {lease.end_date && (
                                <> - {format(new Date(lease.end_date), "MMM yyyy", { locale: nb })}</>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-muted-foreground">Månedlig leie:</span>
                            <div className="font-medium">{formatCurrency(lease.monthly_rent)}</div>
                          </div>
                          
                          {lease.deposit_amount && (
                            <div>
                              <span className="text-muted-foreground">Depositum:</span>
                              <div className="font-medium">{formatCurrency(lease.deposit_amount)}</div>
                            </div>
                          )}
                          
                          <div>
                            <span className="text-muted-foreground">Opprettet:</span>
                            <div className="font-medium">
                              {format(new Date(lease.created_at), "dd.MM.yyyy", { locale: nb })}
                            </div>
                          </div>
                        </div>

                        {/* Deposit Account Info */}
                        {lease.deposit_accounts && lease.deposit_accounts.length > 0 && (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
                              <Building className="h-4 w-4" />
                              Depositumskonto
                            </div>
                            {lease.deposit_accounts.map((account) => (
                              <div key={account.id} className="text-sm space-y-1">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-3 w-3" />
                                  <span>{account.bank_name || 'Instabank'}</span>
                                  <Badge variant="secondary">{account.status}</Badge>
                                </div>
                                <div className="text-blue-700">
                                  Beløp: {formatCurrency(account.deposit_amount)}
                                  {account.interest_rate && (
                                    <span className="ml-2">Rente: {account.interest_rate}%</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Transfer Protocols */}
                        {lease.transfer_protocols && lease.transfer_protocols.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Protokoller:</h4>
                            <div className="flex flex-wrap gap-2">
                              {lease.transfer_protocols.map((protocol) => (
                                <Dialog key={protocol.id}>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <FileText className="h-3 w-3 mr-1" />
                                      {protocol.protocol_type === 'move_in' ? 'Innflyttings' : 'Utflyttings'}protokoll
                                      <span className="ml-1 text-xs text-muted-foreground">
                                        ({format(new Date(protocol.protocol_date), "dd.MM.yy", { locale: nb })})
                                      </span>
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>
                                        {protocol.protocol_type === 'move_in' ? 'Innflyttings' : 'Utflyttings'}protokoll
                                      </DialogTitle>
                                      <DialogDescription>
                                        {lease.tenant.first_name} {lease.tenant.last_name} - {format(new Date(protocol.protocol_date), "PPP", { locale: nb })}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      {protocol.condition_notes && (
                                        <div>
                                          <h4 className="font-medium mb-2">Tilstandsnotater:</h4>
                                          <div className="bg-muted p-3 rounded text-sm">
                                            {protocol.condition_notes.startsWith('{') ? (
                                              <div>
                                                {(() => {
                                                  try {
                                                    const parsed = JSON.parse(protocol.condition_notes);
                                                    return (
                                                      <div className="space-y-4">
                                                        {parsed.general && (
                                                          <div>
                                                            <strong>Generelle notater:</strong>
                                                            <p>{parsed.general}</p>
                                                          </div>
                                                        )}
                                                        {parsed.rooms && (
                                                          <div>
                                                            <strong>Rom for rom:</strong>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                                              {parsed.rooms.map((room: Room, index: number) => (
                                                                <div key={index} className="bg-white p-3 rounded border">
                                                                  <div className="flex items-center justify-between mb-2">
                                                                    <h5 className="font-medium">{room.roomName}</h5>
                                                                    <Badge
                                                                      className={
                                                                        room.condition === 'excellent' ? 'bg-green-100 text-green-800' :
                                                                        room.condition === 'good' ? 'bg-blue-100 text-blue-800' :
                                                                        room.condition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-red-100 text-red-800'
                                                                      }
                                                                    >
                                                                      {room.condition}
                                                                    </Badge>
                                                                  </div>
                                                                  {room.notes && <p className="text-sm mb-2">{room.notes}</p>}
                                                                  {room.damages && room.damages.length > 0 && (
                                                                    <div className="text-sm">
                                                                      <strong>Skader:</strong>
                                                                      <ul className="list-disc list-inside mt-1">
                                                                        {room.damages.map((damage: string, i: number) => (
                                                                          <li key={i} className="text-red-700">{damage}</li>
                                                                        ))}
                                                                      </ul>
                                                                    </div>
                                                                  )}
                                                                  {room.photoUrls && room.photoUrls.length > 0 && (
                                                                    <div className="mt-2">
                                                                      <div className="flex items-center gap-2">
                                                                        <Camera className="h-3 w-3" />
                                                                        <span className="text-xs">{room.photoUrls.length} bilder</span>
                                                                      </div>
                                                                    </div>
                                                                  )}
                                                                </div>
                                                              ))}
                                                            </div>
                                                          </div>
                                                        )}
                                                      </div>
                                                    );
                                                  } catch (e) {
                                                    return protocol.condition_notes;
                                                  }
                                                })()}
                                              </div>
                                            ) : (
                                              protocol.condition_notes
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {protocol.repairs_needed && (
                                        <div>
                                          <h4 className="font-medium mb-2">Nødvendige reparasjoner:</h4>
                                          <div className="bg-yellow-50 p-3 rounded text-sm border border-yellow-200">
                                            {protocol.repairs_needed}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {protocol.photos_urls && protocol.photos_urls.length > 0 && (
                                        <div>
                                          <h4 className="font-medium mb-2">Bilder ({protocol.photos_urls.length}):</h4>
                                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {protocol.photos_urls.map((url, index) => (
                                              <div key={index} className="relative group">
                                                <img
                                                  src={url}
                                                  alt={`Protokoll bilde ${index + 1}`}
                                                  className="w-full h-32 object-cover rounded border"
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                                                  <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => window.open(url, '_blank')}
                                                  >
                                                    <Eye className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2">
                        {lease.status === 'active' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCreateTransferProtocol(lease, 'move_in')}
                              disabled={lease.transfer_protocols?.some(p => p.protocol_type === 'move_in')}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Innflyttingsprotokoll
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCreateTransferProtocol(lease, 'move_out')}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Utflyttingsprotokoll
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transfer Protocol Dialog */}
      {selectedLease && (
        <TransferProtocolDialog
          open={transferProtocolDialogOpen}
          onOpenChange={(open) => {
            setTransferProtocolDialogOpen(open);
            if (!open) {
              setSelectedLease(null);
              fetchLeaseHistory(); // Refresh to show new protocols
            }
          }}
          leaseId={selectedLease.id}
          propertyAddress={propertyAddress}
          tenantName={`${selectedLease.tenant.first_name} ${selectedLease.tenant.last_name}`}
          protocolType={protocolType}
        />
      )}
    </div>
  );
};

export default PropertyLeaseHistory;