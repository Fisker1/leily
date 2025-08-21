import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Property {
  id: string;
  address: string;
  city?: string;
  postal_code?: string;
  property_type?: string;
  size_sqm?: number;
  bedrooms?: number;
  purchase_price?: number;
  purchase_date?: string;
  loan_amount?: number;
  interest_rate?: number;
  loan_duration_years?: number;
  current_value?: number;
  image_url?: string;
  monthly_rent?: number;
  primary_residence?: boolean;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
}

interface PropertyEditDialogProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPropertyUpdated?: () => void;
}

export const PropertyEditDialog = ({ property, open, onOpenChange, onPropertyUpdated }: PropertyEditDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    address: property.address || "",
    city: property.city || "",
    postal_code: property.postal_code || "",
    property_type: property.property_type || "",
    size_sqm: property.size_sqm?.toString() || "",
    bedrooms: property.bedrooms?.toString() || "",
    purchase_price: property.purchase_price?.toString() || "",
    purchase_date: property.purchase_date || "",
    loan_amount: property.loan_amount?.toString() || "",
    interest_rate: property.interest_rate?.toString() || "",
    loan_duration_years: property.loan_duration_years?.toString() || "",
    current_value: property.current_value?.toString() || "",
    monthly_rent: property.monthly_rent?.toString() || "",
    primary_residence: property.primary_residence || false,
    image: null as File | null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = property.image_url;

      // Upload new image if provided
      if (formData.image) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const fileExt = formData.image.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, formData.image);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // If setting as primary residence, unset other properties first
      if (formData.primary_residence) {
        await supabase
          .from('properties')
          .update({ primary_residence: false })
          .eq('owner_id', property.owner_id);
      }

      const { error } = await supabase
        .from('properties')
        .update({
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          property_type: formData.property_type,
          size_sqm: formData.size_sqm ? parseInt(formData.size_sqm) : null,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
          purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
          purchase_date: formData.purchase_date || null,
          loan_amount: formData.loan_amount ? parseFloat(formData.loan_amount) : null,
          interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : null,
          loan_duration_years: formData.loan_duration_years ? parseInt(formData.loan_duration_years) : null,
          current_value: formData.current_value ? parseFloat(formData.current_value) : null,
          monthly_rent: formData.monthly_rent ? parseFloat(formData.monthly_rent) : null,
          primary_residence: formData.primary_residence,
          image_url: imageUrl,
        } as any)
        .eq('id', property.id);

      if (error) throw error;

      toast({
        title: "Suksess",
        description: "Eiendom oppdatert successfully",
      });

      onOpenChange(false);
      onPropertyUpdated?.();
    } catch (error) {
      console.error('Error updating property:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke oppdatere eiendom",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Rediger eiendom
          </DialogTitle>
          <DialogDescription>
            Oppdater informasjon om eiendommen
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Eiendomsdetaljer</CardTitle>
                <CardDescription>Grunnleggende informasjon om eiendommen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Adresse *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="f.eks. Storgata 1"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">By</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      placeholder="Oslo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Postnummer</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => updateField("postal_code", e.target.value)}
                      placeholder="0123"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="property_type">Eiendomstype</Label>
                  <Select value={formData.property_type} onValueChange={(value) => updateField("property_type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Leilighet">Leilighet</SelectItem>
                      <SelectItem value="Enebolig">Enebolig</SelectItem>
                      <SelectItem value="Rekkehus">Rekkehus</SelectItem>
                      <SelectItem value="Tomannsbolig">Tomannsbolig</SelectItem>
                      <SelectItem value="Hytte">Hytte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="size_sqm">Størrelse (m²)</Label>
                    <Input
                      id="size_sqm"
                      type="number"
                      value={formData.size_sqm}
                      onChange={(e) => updateField("size_sqm", e.target.value)}
                      placeholder="85"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bedrooms">Soverom</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) => updateField("bedrooms", e.target.value)}
                      placeholder="3"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Finansielle detaljer</CardTitle>
                <CardDescription>Kjøpspris, lån og verdivurdering</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="purchase_price">Kjøpspris (kr)</Label>
                  <Input
                    id="purchase_price"
                    type="number"
                    value={formData.purchase_price}
                    onChange={(e) => updateField("purchase_price", e.target.value)}
                    placeholder="2800000"
                  />
                </div>

                <div>
                  <Label htmlFor="purchase_date">Kjøpsdato</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => updateField("purchase_date", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="loan_amount">Lånebeløp (kr)</Label>
                  <Input
                    id="loan_amount"
                    type="number"
                    value={formData.loan_amount}
                    onChange={(e) => updateField("loan_amount", e.target.value)}
                    placeholder="2240000"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="interest_rate">Rente (%)</Label>
                    <Input
                      id="interest_rate"
                      type="number"
                      step="0.01"
                      value={formData.interest_rate}
                      onChange={(e) => updateField("interest_rate", e.target.value)}
                      placeholder="4.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="loan_duration_years">Nedbetalingstid (år)</Label>
                    <Input
                      id="loan_duration_years"
                      type="number"
                      value={formData.loan_duration_years}
                      onChange={(e) => updateField("loan_duration_years", e.target.value)}
                      placeholder="25"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="property_image">Nytt bilde av eiendom</Label>
                  <Input
                    id="property_image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFormData(prev => ({ ...prev, image: file }));
                    }}
                    className="cursor-pointer"
                  />
                </div>

                <div>
                  <Label htmlFor="current_value">Nåværende verdi (kr)</Label>
                  <Input
                    id="current_value"
                    type="number"
                    value={formData.current_value}
                    onChange={(e) => updateField("current_value", e.target.value)}
                    placeholder="3200000"
                  />
                </div>

                <div>
                  <Label htmlFor="monthly_rent">Månedsleie (kr)</Label>
                  <Input
                    id="monthly_rent"
                    type="number"
                    value={formData.monthly_rent}
                    onChange={(e) => updateField("monthly_rent", e.target.value)}
                    placeholder="25000"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="primary_residence"
                    checked={formData.primary_residence}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, primary_residence: checked }))}
                  />
                  <Label htmlFor="primary_residence">Primærbolig</Label>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Lagrer..." : "Oppdater eiendom"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};