import { Button } from "@/components/ui/button";
import { Menu, X, Calculator, Briefcase, PieChart, LogOut, Shield } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import LanguageToggle from "./LanguageToggle";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { translations } = useLanguage();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();

  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center gap-3">
                <img src="/lovable-uploads/06b5428c-d307-4463-b072-17ffa12eb59e.png" alt="Leily Logo" className="h-10 w-auto" />
                <span className="text-2xl font-bold text-primary hidden sm:block">Leily</span>
              </Link>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/calculator" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Eiendomskalkulator
              </Link>
              <Link to="/utleie" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Utleie
              </Link>
              <Link to="/portfolio" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Portefølje
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <LanguageToggle />
            {user ? (
              <>
                {isAdmin && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                    </Link>
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => signOut()}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logg ut
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">{translations.nav.signIn}</Link>
                </Button>
                <Button size="sm" className="bg-gradient-primary hover:opacity-90" asChild>
                  <Link to="/calculator">{translations.nav.startAnalysis}</Link>
                </Button>
              </>
            )}
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-foreground"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="px-4 py-6 space-y-6">
              <nav className="flex flex-col space-y-4">
                <Link to="/calculator" className="text-muted-foreground hover:text-primary transition-colors font-medium text-lg flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Eiendomskalkulator
                </Link>
                <Link to="/utleie" className="text-muted-foreground hover:text-primary transition-colors font-medium text-lg flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Utleie
                </Link>
                <Link to="/portfolio" className="text-muted-foreground hover:text-primary transition-colors font-medium text-lg flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Portefølje
                </Link>
              </nav>
                <div className="space-y-4">
                <LanguageToggle />
                {user ? (
                  <>
                    {isAdmin && (
                      <Button variant="outline" className="w-full" size="lg" asChild>
                        <Link to="/admin" className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </Button>
                    )}
                    <Button 
                      className="w-full" 
                      size="lg" 
                      onClick={() => signOut()}
                      variant="outline"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logg ut
                    </Button>
                  </>
                ) : (
                  <Button className="w-full" size="lg" asChild>
                    <Link to="/calculator">{translations.nav.startAnalysis}</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;