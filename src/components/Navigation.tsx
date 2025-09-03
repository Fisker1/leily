import { Button } from "@/components/ui/button";
import { Menu, X, Calculator, Briefcase, PieChart, LogOut, Shield } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import LanguageToggle from "./LanguageToggle";
import LeilyLogo from "./LeilyLogo";
const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    translations
  } = useLanguage();
  const {
    user,
    signOut
  } = useAuth();
  const {
    isAdmin
  } = useUserRole();
  return <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center flex-shrink-0">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <LeilyLogo 
                  showText={false}
                  className="sm:hidden scale-75"
                />
                <LeilyLogo 
                  showText={true}
                  className="hidden sm:flex"
                />
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

          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <div className="hidden sm:block">
              <LanguageToggle />
            </div>
            {user ? (
              <>
                {isAdmin && (
                  <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                    <Link to="/admin" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span className="hidden lg:inline">Admin</span>
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => signOut()} className="hidden sm:flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden lg:inline">Logg ut</span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                  <Link to="/auth" className="text-sm">{translations.nav.signIn}</Link>
                </Button>
                <Button size="sm" className="bg-gradient-primary hover:opacity-90 hidden sm:flex" asChild>
                  <Link to="/calculator" className="text-sm">{translations.nav.startAnalysis}</Link>
                </Button>
              </>
            )}
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-foreground p-2">
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 shadow-lg z-50">
            <div className="container mx-auto px-4 py-6 space-y-6">
              <nav className="flex flex-col space-y-4">
                <Link 
                  to="/calculator" 
                  className="text-foreground hover:text-primary transition-colors font-medium text-lg flex items-center gap-3 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Calculator className="h-5 w-5" />
                  Eiendomskalkulator
                </Link>
                <Link 
                  to="/utleie" 
                  className="text-foreground hover:text-primary transition-colors font-medium text-lg flex items-center gap-3 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Briefcase className="h-5 w-5" />
                  Utleie
                </Link>
                <Link 
                  to="/portfolio" 
                  className="text-foreground hover:text-primary transition-colors font-medium text-lg flex items-center gap-3 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <PieChart className="h-5 w-5" />
                  Portefølje
                </Link>
              </nav>
              <div className="space-y-4 pt-4 border-t border-border">
                <LanguageToggle />
                {user ? (
                  <>
                    {isAdmin && (
                      <Button variant="outline" className="w-full justify-start" size="lg" asChild>
                        <Link to="/admin" className="flex items-center gap-3" onClick={() => setIsMenuOpen(false)}>
                          <Shield className="h-5 w-5" />
                          Admin Dashboard
                        </Link>
                      </Button>
                    )}
                    <Button 
                      className="w-full justify-start" 
                      size="lg" 
                      onClick={() => {
                        signOut();
                        setIsMenuOpen(false);
                      }} 
                      variant="outline"
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Logg ut
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full justify-start" size="lg" asChild>
                      <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                        {translations.nav.signIn}
                      </Link>
                    </Button>
                    <Button className="w-full bg-gradient-primary hover:opacity-90" size="lg" asChild>
                      <Link to="/calculator" onClick={() => setIsMenuOpen(false)}>
                        {translations.nav.startAnalysis}
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>;
};
export default Navigation;