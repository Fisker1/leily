import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Shield, Star, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";

const MyProfile = () => {
  const { user, profile, updateProfile } = useAuth();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-avatar.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload image to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: data.publicUrl });

      toast({
        title: "Profilbilde oppdatert",
        description: "Ditt nye profilbilde er lastet opp.",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Feil ved opplasting",
        description: "Kunne ikke laste opp bildet. Prøv igjen.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getRoleBadge = () => {
    if (!user) return null;

    // Check user roles from the database
    // For now, we'll check if user is admin using the existing hook
    if (isAdmin) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="cursor-help">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Administrator - Full tilgang til alle funksjoner</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // TODO: Add ambassador role check when implemented
    // if (isAmbassador) {
    //   return (
    //     <TooltipProvider>
    //       <Tooltip>
    //         <TooltipTrigger asChild>
    //           <Badge variant="secondary" className="cursor-help">
    //             <Star className="w-3 h-3 mr-1" />
    //             Ambassadør
    //           </Badge>
    //         </TooltipTrigger>
    //         <TooltipContent>
    //           <p>Ambassadør - Gratis tilgang til alle premium funksjoner</p>
    //         </TooltipContent>
    //       </Tooltip>
    //     </TooltipProvider>
    //   );
    // }

    // Check subscription tier
    if (profile?.subscription_tier === 'premium') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="cursor-help">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Premium bruker - Tilgang til alle betalte funksjoner</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return null;
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">Min profil</h1>
            <p className="text-muted-foreground mt-2">Administrer din profil og innstillinger</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profilinformasjon</CardTitle>
              <CardDescription>
                Oppdater ditt profilbilde og se din kontoinformasjon
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Image Section */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-lg font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">
                      {profile?.full_name || 'Ingen navn satt'}
                    </h3>
                    {getRoleBadge()}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {uploading && (
                    <p className="text-sm text-muted-foreground">Laster opp bilde...</p>
                  )}
                </div>
              </div>

              {/* User Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-post</Label>
                  <Input
                    id="email"
                    value={user.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subscription">Abonnement</Label>
                  <Input
                    id="subscription"
                    value={profile?.subscription_tier === 'premium' ? 'Premium' : 'Gratis'}
                    disabled
                    className="bg-muted"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="member-since">Medlem siden</Label>
                  <Input
                    id="member-since"
                    value={user.created_at ? new Date(user.created_at).toLocaleDateString('no-NO') : 'Ukjent'}
                    disabled
                    className="bg-muted"
                  />
                </div>
                
                {profile?.subscription_end && (
                  <div className="space-y-2">
                    <Label htmlFor="subscription-end">Abonnement utløper</Label>
                    <Input
                      id="subscription-end"
                      value={new Date(profile.subscription_end).toLocaleDateString('no-NO')}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;