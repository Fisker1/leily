import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithProvider } = useAuth();
  const { translations, language } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(formData.email, formData.password);

    if (error) {
      toast({
        title: translations.common.error,
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: translations.auth.welcome,
        description: translations.auth.signInSuccess,
      });
      navigate('/');
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: translations.common.error,
        description: translations.auth.passwordMismatch,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await signUp(formData.email, formData.password, formData.fullName);

    if (error) {
      toast({
        title: translations.common.error,
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: translations.auth.success,
        description: translations.auth.signUpSuccess,
      });
    }

    setLoading(false);
  };

  const handleSocialSignIn = async (provider: 'google' | 'facebook') => {
    setLoading(true);
    
    const { error } = await signInWithProvider(provider);
    
    if (error) {
      toast({
        title: translations.common.error,
        description: error.message,
        variant: "destructive",
      });
    }
    
    setLoading(false);
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
            {translations.common.backToHome}
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            {translations.auth.welcomeBack}
          </h1>
          <p className="text-muted-foreground mt-2">
            {translations.auth.signInToAccount}
          </p>
        </div>

        <Card className="shadow-medium">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">{translations.auth.getStarted}</CardTitle>
            <CardDescription>
              {translations.auth.chooseSignInMethod}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSocialSignIn('google')}
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
                {translations.auth.continueWithGoogle}
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSocialSignIn('facebook')}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                )}
                {translations.auth.continueWithFacebook}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  {translations.auth.orContinueWith}
                </span>
              </div>
            </div>

            <Tabs defaultValue="signin" className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">{translations.auth.signIn}</TabsTrigger>
                <TabsTrigger value="signup">{translations.auth.signUp}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4 mt-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">{translations.auth.email}</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="din@epost.no"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">{translations.auth.password}</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    {translations.auth.signIn}
                  </Button>
                </form>
                
                {/* Quick test login section */}
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="text-center mb-3">
                    <span className="text-xs text-muted-foreground bg-background px-2">
                      Stage Test Login
                    </span>
                  </div>
                  <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-center text-muted-foreground">
                      🥷 Test bruker for staging
                    </div>
                    <div className="text-xs text-center font-mono">
                      <div>Email: stager@vipps.no</div>
                      <div>Passord: blåmeis</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          email: 'anderslundoy@protonmail.com',
                          password: 'blåmeis'
                        });
                      }}
                    >
                      Fyll inn test-bruker
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4 mt-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">{translations.auth.fullName}</Label>
                    <Input
                      id="signup-name"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Ditt fulle navn"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{translations.auth.email}</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="din@epost.no"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{translations.auth.password}</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">{translations.auth.confirmPassword}</Label>
                    <Input
                      id="confirm-password"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    {translations.auth.signUp}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link 
            to="/pricing" 
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            {translations.auth.learnAboutPlans}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;