import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Loader2 } from 'lucide-react';

const SimpleAuth = () => {
  const navigate = useNavigate();
  const { translations } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    console.log('Prøver Google innlogging...');
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      
      if (error) {
        console.error('Google sign in error:', error);
        alert('Feil ved Google innlogging: ' + error.message);
      } else {
        console.log('Google sign in success:', data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Uventet feil: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setLoading(true);
    console.log('Prøver Facebook innlogging...');
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      
      if (error) {
        console.error('Facebook sign in error:', error);
        alert('Feil ved Facebook innlogging: ' + error.message);
      } else {
        console.log('Facebook sign in success:', data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Uventet feil: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVippsSignIn = async () => {
    setLoading(true);
    console.log('Prøver Vipps innlogging...');
    
    try {
      // Vipps bruker custom OIDC provider i Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'vipps' as any, // Custom provider
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            prompt: 'login',
          },
        },
      });
      
      if (error) {
        console.error('Vipps sign in error:', error);
        // Hvis Vipps ikke er konfigurert enda, vis informativ melding
        if (error.message.includes('Provider not found') || error.message.includes('Invalid provider')) {
          alert('Vipps innlogging er ikke konfigurert enda. Kontakt administrator for å aktivere Vipps Login.');
        } else {
          alert('Feil ved Vipps innlogging: ' + error.message);
        }
      } else {
        console.log('Vipps sign in success:', data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Uventet feil: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link 
            to="/"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbake til forsiden
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            Logg inn på Leily
          </h1>
          <p className="text-muted-foreground mt-2">
            Velg din innloggingsmetode
          </p>
        </div>

        <Card className="shadow-medium">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Kom i gang</CardTitle>
            <CardDescription>
              Velg hvordan du vil logge inn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Fortsett med Google
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={handleFacebookSignIn}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              )}
              Fortsett med Facebook
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleVippsSignIn}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <div className="w-4 h-4 mr-2 bg-orange-500 rounded-sm flex items-center justify-center">
                  <span className="text-white text-xs font-bold">V</span>
                </div>
              )}
              Fortsett med Vipps
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                setLoading(true);
                try {
                  const { data, error } = await supabase.auth.signInWithPassword({
                    email: 'stager@vipps.no',
                    password: 'blåmeis'
                  });
                  
                  if (error) {
                    console.error('Test login error:', error);
                    alert('Test login feilet: ' + error.message);
                  } else {
                    console.log('Test login success:', data);
                    navigate('/dashboard');
                  }
                } catch (err) {
                  console.error('Unexpected error:', err);
                  alert('Uventet feil: ' + (err as Error).message);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <div className="w-4 h-4 mr-2 text-slate-700">
                  🥷
                </div>
              )}
              Test Bruker (Stager)
            </Button>

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Ved å logge inn godtar du våre{' '}
                <Link to="/terms" className="text-primary hover:underline">
                  vilkår
                </Link>
                {' '}og{' '}
                <Link to="/privacy" className="text-primary hover:underline">
                  personvernerklæring
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link 
            to="/pricing" 
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Lær om våre abonnementsplaner
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SimpleAuth;