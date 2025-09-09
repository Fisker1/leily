import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Users, AlertTriangle, Activity, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface AuditLogEntry {
  id: string;
  table_name: string;
  action: string;
  user_id: string;
  details: any;
  created_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  subscription_tier?: string;
  subscription_end?: string;
}

interface UserWithRoles extends UserProfile {
  user_roles?: Array<{
    role: 'admin' | 'user' | 'ambassador';
  }>;
}

const SecurityDashboard: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoteEmail, setPromoteEmail] = useState('');
  const [ambassadorEmail, setAmbassadorEmail] = useState('');

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      
      // Fetch audit logs
      const { data: logs, error: logsError } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) {
        console.error('Error fetching audit logs:', logsError);
      } else {
        setAuditLogs(logs || []);
      }

      // Fetch users with their profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching users:', profilesError);
        setUsers([]);
      } else {
        // Fetch user roles separately
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');

        if (rolesError) {
          console.error('Error fetching roles:', rolesError);
          setUsers(profiles || []);
        } else {
          // Combine profiles with their roles
          const usersWithRoles = (profiles || []).map(profile => ({
            ...profile,
            user_roles: roles?.filter(role => role.user_id === profile.id) || []
          }));
          setUsers(usersWithRoles);
        }
      }

    } catch (error) {
      console.error('Error fetching security data:', error);
      toast({
        title: 'Feil',
        description: 'Kunne ikke hente sikkerhetsdata',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const promoteUserToAdmin = async () => {
    if (!promoteEmail.trim()) {
      toast({
        title: 'Feil',
        description: 'Vennligst skriv inn en e-postadresse',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Find user by email
      const targetUser = users.find(u => u.email.toLowerCase() === promoteEmail.toLowerCase());
      
      if (!targetUser) {
        toast({
          title: 'Feil',
          description: 'Bruker ikke funnet',
          variant: 'destructive',
        });
        return;
      }

      // Call the promote function
      const { error } = await supabase.rpc('promote_user_to_admin', {
        target_user_id: targetUser.id
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Suksess',
        description: `${promoteEmail} er nå forfremmet til administrator`,
      });

      setPromoteEmail('');
      fetchSecurityData(); // Refresh data

    } catch (error: any) {
      console.error('Error promoting user:', error);
      toast({
        title: 'Feil',
        description: error.message || 'Kunne ikke forfremme bruker',
        variant: 'destructive',
      });
    }
  };

  const promoteUserToAmbassador = async () => {
    if (!ambassadorEmail.trim()) {
      toast({
        title: 'Feil',
        description: 'Vennligst skriv inn en e-postadresse',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Find user by email
      const targetUser = users.find(u => u.email.toLowerCase() === ambassadorEmail.toLowerCase());
      
      if (!targetUser) {
        toast({
          title: 'Feil',
          description: 'Bruker ikke funnet',
          variant: 'destructive',
        });
        return;
      }

      // Call the promote to ambassador function
      const { error } = await supabase.rpc('promote_user_to_ambassador', {
        target_user_id: targetUser.id
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Suksess',
        description: `${ambassadorEmail} er nå forfremmet til ambassadør med gratis premium abonnement`,
      });

      setAmbassadorEmail('');
      fetchSecurityData(); // Refresh data

    } catch (error: any) {
      console.error('Error promoting user to ambassador:', error);
      toast({
        title: 'Feil',
        description: error.message || 'Kunne ikke forfremme bruker til ambassadør',
        variant: 'destructive',
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('no-NO');
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action.toLowerCase()) {
      case 'insert':
        return 'default';
      case 'update':
        return 'secondary';
      case 'delete':
        return 'destructive';
      case 'bootstrap_admin_created':
      case 'user_promoted_to_admin':
      case 'user_promoted_to_ambassador':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Sikkerhetsdashbord</h2>
      </div>

      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Brukere</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sikkerhetslogg</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kritiske Hendelser</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditLogs.filter(log => 
                log.action === 'bootstrap_admin_created' || 
                log.action === 'user_promoted_to_admin' ||
                log.action === 'user_promoted_to_ambassador'
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="audit" className="w-full">
        <TabsList>
          <TabsTrigger value="audit">Sikkerhetslogg</TabsTrigger>
          <TabsTrigger value="users">Brukerstyring</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sikkerhetslogg</CardTitle>
              <CardDescription>
                Oversikt over alle sikkerhetsrelaterte hendelser
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {auditLogs.length === 0 ? (
                  <p className="text-muted-foreground">Ingen loggoppføringer funnet</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {log.action}
                          </Badge>
                          <span className="text-sm font-medium">{log.table_name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatTimestamp(log.created_at)}
                        </p>
                        {log.details && (
                          <pre className="text-xs bg-muted p-2 rounded max-w-md overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Forfrem Bruker til Administrator
              </CardTitle>
              <CardDescription>
                Legg til administrative rettigheter til en eksisterende bruker
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Advarsel</AlertTitle>
                <AlertDescription>
                  Administrative rettigheter gir full tilgang til systemet. Vær forsiktig med hvem du gir disse rettighetene til.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="promote-email">Bruker E-post</Label>
                <div className="flex gap-2">
                  <Input
                    id="promote-email"
                    type="email"
                    placeholder="bruker@example.com"
                    value={promoteEmail}
                    onChange={(e) => setPromoteEmail(e.target.value)}
                  />
                  <Button onClick={promoteUserToAdmin}>
                    Forfrem til Admin
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-amber-600" />
                Forfrem Bruker til Ambassadør
              </CardTitle>
              <CardDescription>
                Gi en bruker ambassadør-status med gratis premium abonnement (1 år)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <UserPlus className="h-4 w-4" />
                <AlertTitle>Ambassadør-fordeler</AlertTitle>
                <AlertDescription>
                  Ambassadører får gratis premium abonnement i 1 år og kan hjelpe andre brukere.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="ambassador-email">Bruker E-post</Label>
                <div className="flex gap-2">
                  <Input
                    id="ambassador-email"
                    type="email"
                    placeholder="bruker@example.com"
                    value={ambassadorEmail}
                    onChange={(e) => setAmbassadorEmail(e.target.value)}
                  />
                  <Button onClick={promoteUserToAmbassador} className="bg-amber-600 hover:bg-amber-700">
                    Forfrem til Ambassadør
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registrerte Brukere</CardTitle>
              <CardDescription>
                Oversikt over alle brukere i systemet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.full_name || 'Ikke angitt'}</p>
                        {user.user_roles?.map((role) => (
                          <Badge 
                            key={role.role} 
                            variant={role.role === 'admin' ? 'destructive' : role.role === 'ambassador' ? 'default' : 'secondary'}
                            className={role.role === 'ambassador' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                          >
                            {role.role === 'admin' ? 'Admin' : 
                             role.role === 'ambassador' ? 'Ambassadør' : 'Bruker'}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.subscription_tier && user.subscription_tier !== 'free' && (
                        <p className="text-xs text-green-600">
                          {user.subscription_tier === 'premium' ? 'Premium' : user.subscription_tier} 
                          {user.subscription_end && ` (til ${new Date(user.subscription_end).toLocaleDateString('no-NO')})`}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Registrert: {formatTimestamp(user.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;