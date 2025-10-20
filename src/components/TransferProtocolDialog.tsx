import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Camera, Upload, Trash2, Eye, Download, FileText, Home, CheckCircle2, XCircle, AlertTriangle, Plus } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TransferProtocolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaseId: string;
  propertyAddress: string;
  tenantName: string;
  protocolType: 'move_in' | 'move_out';
}

interface RoomInspection {
  id: string;
  roomName: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  notes: string;
  photos: File[];
  photoUrls: string[];
  damages: string[];
}

interface ProtocolData {
  protocolDate: Date | null;
  conditionNotes: string;
  damages: string;
  repairsNeeded: string;
  signaturesCompleted: boolean;
}

const ROOM_TYPES = [
  'Stue',
  'Kjøkken', 
  'Soverom 1',
  'Soverom 2',
  'Soverom 3',
  'Bad',
  'WC',
  'Gang',
  'Balkong/Terrasse',
  'Bod/Kjeller',
  'Annet'
];

const TransferProtocolDialog = ({ 
  open, 
  onOpenChange, 
  leaseId, 
  propertyAddress, 
  tenantName, 
  protocolType 
}: TransferProtocolDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(0);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [protocolData, setProtocolData] = useState<ProtocolData>({
    protocolDate: new Date(),
    conditionNotes: '',
    damages: '',
    repairsNeeded: '',
    signaturesCompleted: false
  });

  const [rooms, setRooms] = useState<RoomInspection[]>(() => 
    ROOM_TYPES.map((name, index) => ({
      id: `room-${index}`,
      roomName: name,
      condition: 'good' as const,
      notes: '',
      photos: [],
      photoUrls: [],
      damages: []
    }))
  );

  const handleProtocolDataChange = (field: keyof ProtocolData, value: string | number | boolean | Date) => {
    setProtocolData(prev => ({ ...prev, [field]: value }));
  };

  const handleRoomDataChange = (roomIndex: number, field: keyof RoomInspection, value: string | number | boolean | string[] | File[]) => {
    setRooms(prev => prev.map((room, index) => 
      index === roomIndex ? { ...room, [field]: value } : room
    ));
  };

  const handlePhotoUpload = async (roomIndex: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhoto(true);
    const newPhotos: File[] = [];
    const newPhotoUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file type and size
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Ugyldig filtype",
            description: "Kun bildefiler er tillatt",
            variant: "destructive",
          });
          continue;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          toast({
            title: "Fil for stor",
            description: "Maksimal filstørrelse er 5MB",
            variant: "destructive",
          });
          continue;
        }

        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const filePath = `transfer-protocols/${leaseId}/${rooms[roomIndex].roomName}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('property-documents')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({
            title: "Opplastingsfeil",
            description: "Kunne ikke laste opp bilde",
            variant: "destructive",
          });
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('property-documents')
          .getPublicUrl(filePath);

        newPhotos.push(file);
        newPhotoUrls.push(publicUrl);
      }

      // Update room with new photos
      handleRoomDataChange(roomIndex, 'photos', [...rooms[roomIndex].photos, ...newPhotos]);
      handleRoomDataChange(roomIndex, 'photoUrls', [...rooms[roomIndex].photoUrls, ...newPhotoUrls]);

      toast({
        title: "Bilder lastet opp",
        description: `${newPhotos.length} bilder ble lagt til ${rooms[roomIndex].roomName}`,
      });

    } catch (error) {
      console.error('Error uploading photos:', error);
      toast({
        title: "Feil ved opplasting",
        description: "Kunne ikke laste opp alle bilder",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async (roomIndex: number, photoIndex: number) => {
    const room = rooms[roomIndex];
    const photoUrl = room.photoUrls[photoIndex];

    // Remove from storage if it's uploaded
    if (photoUrl && photoUrl.includes('supabase')) {
      try {
        const filePath = photoUrl.split('/property-documents/')[1];
        await supabase.storage
          .from('property-documents')
          .remove([filePath]);
      } catch (error) {
        console.error('Error removing photo from storage:', error);
      }
    }

    // Update room data
    const newPhotos = room.photos.filter((_, index) => index !== photoIndex);
    const newPhotoUrls = room.photoUrls.filter((_, index) => index !== photoIndex);

    handleRoomDataChange(roomIndex, 'photos', newPhotos);
    handleRoomDataChange(roomIndex, 'photoUrls', newPhotoUrls);
  };

  const addDamage = (roomIndex: number) => {
    const damageText = prompt('Beskriv skaden:');
    if (damageText && damageText.trim()) {
      const currentDamages = rooms[roomIndex].damages;
      handleRoomDataChange(roomIndex, 'damages', [...currentDamages, damageText.trim()]);
    }
  };

  const removeDamage = (roomIndex: number, damageIndex: number) => {
    const currentDamages = rooms[roomIndex].damages;
    const newDamages = currentDamages.filter((_, index) => index !== damageIndex);
    handleRoomDataChange(roomIndex, 'damages', newDamages);
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'excellent': return <CheckCircle2 className="h-4 w-4" />;
      case 'good': return <CheckCircle2 className="h-4 w-4" />;
      case 'fair': return <AlertTriangle className="h-4 w-4" />;
      case 'poor': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const handleSubmit = async () => {
    if (!protocolData.protocolDate) {
      toast({
        title: "Manglende informasjon",
        description: "Vennligst velg protokolldato",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Collect all photo URLs
      const allPhotoUrls = rooms.flatMap(room => room.photoUrls);

      // Create the transfer protocol
      const { data: protocol, error: protocolError } = await supabase
        .from('transfer_protocols')
        .insert([{
          lease_id: leaseId,
          property_owner_id: user?.id,
          protocol_type: protocolType,
          protocol_date: protocolData.protocolDate.toISOString(),
          condition_notes: protocolData.conditionNotes,
          damages: protocolData.damages,
          repairs_needed: protocolData.repairsNeeded,
          signatures_completed: protocolData.signaturesCompleted,
          photos_urls: allPhotoUrls
        }])
        .select()
        .single();

      if (protocolError) {
        throw protocolError;
      }

      // Store detailed room inspection data as JSON in condition_notes
      const roomsData = rooms.map(room => ({
        roomName: room.roomName,
        condition: room.condition,
        notes: room.notes,
        damages: room.damages,
        photoUrls: room.photoUrls
      }));

      // Update protocol with detailed room data
      const { error: updateError } = await supabase
        .from('transfer_protocols')
        .update({
          condition_notes: JSON.stringify({
            general: protocolData.conditionNotes,
            rooms: roomsData
          })
        })
        .eq('id', protocol.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Protokoll opprettet",
        description: `${protocolType === 'move_in' ? 'Innflyttings' : 'Utflyttings'}protokoll er lagret`,
      });

      // Reset form and close dialog
      setProtocolData({
        protocolDate: new Date(),
        conditionNotes: '',
        damages: '',
        repairsNeeded: '',
        signaturesCompleted: false
      });
      setRooms(ROOM_TYPES.map((name, index) => ({
        id: `room-${index}`,
        roomName: name,
        condition: 'good' as const,
        notes: '',
        photos: [],
        photoUrls: [],
        damages: []
      })));
      setCurrentRoom(0);
      onOpenChange(false);

    } catch (error) {
      console.error('Error creating transfer protocol:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke opprette protokoll. Prøv igjen.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentRoomData = rooms[currentRoom];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {protocolType === 'move_in' ? 'Innflyttingsprotokoll' : 'Utflyttingsprotokoll'}
          </DialogTitle>
          <DialogDescription>
            Dokumenter tilstanden på eiendommen rom for rom. {propertyAddress} - {tenantName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Room Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Rom ({currentRoom + 1}/{rooms.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {rooms.map((room, index) => (
                  <Button
                    key={room.id}
                    variant={index === currentRoom ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setCurrentRoom(index)}
                  >
                    <div className="flex items-center gap-2">
                      {getConditionIcon(room.condition)}
                      <span className="text-xs">{room.roomName}</span>
                      {room.photos.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {room.photoUrls.length}
                        </Badge>
                      )}
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Current Room Inspection */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    {currentRoomData.roomName}
                  </span>
                  <Badge className={cn("px-2 py-1", getConditionColor(currentRoomData.condition))}>
                    {getConditionIcon(currentRoomData.condition)}
                    <span className="ml-1 capitalize">{currentRoomData.condition}</span>
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Condition Selection */}
                <div>
                  <Label>Tilstand</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {[
                      { value: 'excellent', label: 'Utmerket', color: 'text-green-600' },
                      { value: 'good', label: 'God', color: 'text-blue-600' },
                      { value: 'fair', label: 'Akseptabel', color: 'text-yellow-600' },
                      { value: 'poor', label: 'Dårlig', color: 'text-red-600' }
                    ].map((condition) => (
                      <Button
                        key={condition.value}
                        variant={currentRoomData.condition === condition.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleRoomDataChange(currentRoom, 'condition', condition.value)}
                        className={condition.value === currentRoomData.condition ? '' : condition.color}
                      >
                        {condition.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="room-notes">Notater</Label>
                  <Textarea
                    id="room-notes"
                    placeholder="Beskriv tilstanden på rommet..."
                    value={currentRoomData.notes}
                    onChange={(e) => handleRoomDataChange(currentRoom, 'notes', e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Damages */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Skader</Label>
                    <Button size="sm" variant="outline" onClick={() => addDamage(currentRoom)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Legg til skade
                    </Button>
                  </div>
                  {currentRoomData.damages.length > 0 ? (
                    <div className="space-y-2">
                      {currentRoomData.damages.map((damage, index) => (
                        <div key={index} className="flex items-center justify-between bg-red-50 p-2 rounded">
                          <span className="text-sm text-red-800">{damage}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeDamage(currentRoom, index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Ingen skader registrert</p>
                  )}
                </div>

                {/* Photos */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Bilder</Label>
                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(currentRoom, e)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPhoto}
                      >
                        <Camera className="h-4 w-4 mr-1" />
                        {uploadingPhoto ? 'Laster opp...' : 'Ta bilde'}
                      </Button>
                    </div>
                  </div>
                  
                  {currentRoomData.photoUrls.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {currentRoomData.photoUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`${currentRoomData.roomName} bilde ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => window.open(url, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemovePhoto(currentRoom, index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Ingen bilder lastet opp</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentRoom(Math.max(0, currentRoom - 1))}
                disabled={currentRoom === 0}
              >
                Forrige rom
              </Button>
              <span className="flex items-center text-sm text-muted-foreground">
                {currentRoom + 1} av {rooms.length} rom
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentRoom(Math.min(rooms.length - 1, currentRoom + 1))}
                disabled={currentRoom === rooms.length - 1}
              >
                Neste rom
              </Button>
            </div>

            {/* Protocol Summary */}
            {currentRoom === rooms.length - 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Protokoll sammendrag</CardTitle>
                  <CardDescription>
                    Generelle notater og fullfør protokollen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Protokolldato</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !protocolData.protocolDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {protocolData.protocolDate ? format(protocolData.protocolDate, "PPP", { locale: nb }) : "Velg dato"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={protocolData.protocolDate || undefined}
                          onSelect={(date) => handleProtocolDataChange('protocolDate', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="general-notes">Generelle notater</Label>
                    <Textarea
                      id="general-notes"
                      placeholder="Generelle kommentarer om eiendommens tilstand..."
                      value={protocolData.conditionNotes}
                      onChange={(e) => handleProtocolDataChange('conditionNotes', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="repairs-needed">Nødvendige reparasjoner</Label>
                    <Textarea
                      id="repairs-needed"
                      placeholder="Lista opp reparasjoner som må gjøres..."
                      value={protocolData.repairsNeeded}
                      onChange={(e) => handleProtocolDataChange('repairsNeeded', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-between mt-8">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                      Avbryt
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                      {loading ? "Lagrer..." : "Lagre protokoll"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransferProtocolDialog;