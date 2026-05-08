import AppShell from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut, Mail, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Innstillinger = () => {
  const { user, signOut } = useAuth();

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "??";

  return (
    <AppShell title="Innstillinger">
      {/* Profile card */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">
                {user?.user_metadata?.full_name || user?.email || "Bruker"}
              </p>
              <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user?.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info section */}
      <Card className="mb-6">
        <CardContent className="p-0 divide-y divide-border">
          <div className="px-4 py-3 flex items-center gap-3">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Selvhostet</p>
              <p className="text-xs text-muted-foreground">
                All data lagres lokalt på din server
              </p>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Konto opprettet</p>
              <p className="text-xs text-muted-foreground">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("nb-NO", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Ukjent"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sign out */}
      <Button
        variant="outline"
        className="w-full text-destructive hover:text-destructive hover:bg-destructive/5"
        onClick={() => signOut()}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Logg ut
      </Button>
    </AppShell>
  );
};

export default Innstillinger;
