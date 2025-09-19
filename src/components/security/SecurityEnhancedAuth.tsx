import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { useToast } from '@/hooks/use-toast';

interface SecurityEnhancedAuthProps {
  mode: 'signin' | 'signup';
  onToggleMode: () => void;
}

const SecurityEnhancedAuth: React.FC<SecurityEnhancedAuthProps> = ({ mode, onToggleMode }) => {
  const { signIn, signUp } = useAuth();
  const { logAuthAttempt } = useSecurityMonitoring();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const validatePassword = async (password: string): Promise<string[]> => {
    try {
      // Use the enhanced server-side password validation
      const { data, error } = await supabase.rpc('validate_password_strength', {
        password_text: password
      });

      if (error) {
        console.error('Password validation error:', error);
        // Fallback to client-side validation
        return clientSidePasswordValidation(password);
      }

      return (data as any)?.issues || [];
    } catch (error) {
      console.error('Password validation error:', error);
      return clientSidePasswordValidation(password);
    }
  };

  const clientSidePasswordValidation = (password: string): string[] => {
    const errors: string[] = [];
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123', 
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];
    
    if (password.length < 12) {
      errors.push('Passordet må være minst 12 tegn langt for høy sikkerhet');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Passordet må inneholde minst én stor bokstav');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Passordet må inneholde minst én liten bokstav');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Passordet må inneholde minst ett tall');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Passordet må inneholde minst ett spesialtegn (!@#$%^&* etc.)');
    }
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Dette passordet er for vanlig og lett å gjette');
    }

    return errors;
  };

  const calculatePasswordStrength = async (password: string): Promise<number> => {
    try {
      const { data, error } = await supabase.rpc('validate_password_strength', {
        password_text: password
      });

      if (error) {
        return clientSidePasswordStrength(password);
      }

      return (data as any)?.score || 0;
    } catch (error) {
      return clientSidePasswordStrength(password);
    }
  };

  const clientSidePasswordStrength = (password: string): number => {
    let strength = 0;
    
    if (password.length >= 12) strength += 25;
    if (password.length >= 16) strength += 10;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 20;

    return Math.min(strength, 100);
  };

  const handlePasswordChange = async (password: string) => {
    setFormData(prev => ({ ...prev, password }));
    
    if (mode === 'signup') {
      const strength = await calculatePasswordStrength(password);
      setPasswordStrength(strength);
      
      const validationErrors = await validatePassword(password);
      setErrors(validationErrors);
    }
  };

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength < 30) return 'bg-destructive';
    if (strength < 60) return 'bg-warning';
    if (strength < 80) return 'bg-yellow-500';
    return 'bg-success';
  };

  const getPasswordStrengthText = (strength: number): string => {
    if (strength < 30) return 'Svakt';
    if (strength < 60) return 'Middels';
    if (strength < 80) return 'Sterkt';
    return 'Veldig sterkt';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        // Validate password strength for signup - require minimum 70 for high security
        if (passwordStrength < 70) {
          toast({
            title: 'Passord ikke sterkt nok',
            description: 'For høy sikkerhet kreves et passord med minst 70% styrke',
            variant: 'destructive',
          });
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          toast({
            title: 'Passord matcher ikke',
            description: 'Bekreft at passordene er identiske',
            variant: 'destructive',
          });
          return;
        }

        const { error } = await signUp(formData.email, formData.password, formData.fullName);
        
        if (error) {
          logAuthAttempt(false, 'email_signup');
          toast({
            title: 'Registrering feilet',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          logAuthAttempt(true, 'email_signup');
          toast({
            title: 'Registrering vellykket',
            description: 'Sjekk e-posten din for bekreftelseslenke',
          });
        }
      } else {
        const { error } = await signIn(formData.email, formData.password);
        
        if (error) {
          logAuthAttempt(false, 'email_signin');
          toast({
            title: 'Innlogging feilet',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          logAuthAttempt(true, 'email_signin');
        }
      }
    } catch (error: any) {
      logAuthAttempt(false, mode === 'signup' ? 'email_signup' : 'email_signin');
      toast({
        title: 'Feil',
        description: 'En uventet feil oppstod',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <CardTitle className="text-2xl">
            {mode === 'signin' ? 'Logg inn' : 'Registrer deg'}
          </CardTitle>
        </div>
        <CardDescription>
          {mode === 'signin' 
            ? 'Skriv inn dine påloggingsopplysninger'
            : 'Opprett en ny konto med sikre innstillinger'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Fullt navn</Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">E-post</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Passord</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            {mode === 'signup' && formData.password && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Passordstyrke:</span>
                  <span className={passwordStrength >= 60 ? 'text-success' : 'text-destructive'}>
                    {getPasswordStrengthText(passwordStrength)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getPasswordStrengthColor(passwordStrength)}`}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Bekreft passord</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
              />
            </div>
          )}

          {errors.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Behandler...' : (mode === 'signin' ? 'Logg inn' : 'Registrer deg')}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={onToggleMode}
              className="text-sm"
            >
              {mode === 'signin' 
                ? 'Har du ikke en konto? Registrer deg her'
                : 'Har du allerede en konto? Logg inn her'
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SecurityEnhancedAuth;