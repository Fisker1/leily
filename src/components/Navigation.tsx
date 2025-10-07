import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Menu, X, Calculator, Briefcase, PieChart, LogOut, Shield, User, MoreVertical, Bot } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import LanguageToggle from "./LanguageToggle";
import LeilyLogo from "./LeilyLogo";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { translations } = useLanguage();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();

  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 sticky top-0 z-50 w-full border-b border-border/50">
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Left Section */}
          <div className="flex items-center flex-shrink-0">
            <Link to={user ? "/dashboard" : "/"} className="flex items-center">
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
          
          {/* Center Navigation - Only visible on desktop */}
          <div className="hidden md:flex flex-1 justify-center">
            <div className="flex items-center space-x-8">
              <Link to="/calculator" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 mt-2">
                <Calculator className="h-4 w-4" />
                Eiendomskalkulator
              </Link>
              <Link to="/utleie" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 mt-2">
                <Briefcase className="h-4 w-4" />
                Utleie
              </Link>
              <Link to="/portfolio" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 mt-2">
                <PieChart className="h-4 w-4" />
                Portefølje
              </Link>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center justify-end space-x-2 flex-shrink-0">
            {user ? (
              <>
                {/* Utleie Agent Button */}
                <Button variant="outline" size="sm" asChild className="border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 hidden lg:flex">
                  <Link to="/utleie-agent" className="text-sm font-medium text-primary flex items-center gap-1">
                    <Bot className="h-4 w-4" />
                    Utleie Agent
                  </Link>
                </Button>
                
                {/* Desktop Dropdown Menu */}
                <div className="hidden sm:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="p-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40">
                        <MoreVertical className="h-5 w-5 text-primary" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link to="/min-side" className="flex items-center gap-2 w-full">
                          <User className="h-4 w-4" />
                          Min side
                        </Link>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="flex items-center gap-2 w-full">
                            <Shield className="h-4 w-4" />
                            Admin
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => signOut()} className="flex items-center gap-2">
                        <LogOut className="h-4 w-4" />
                        Logg ut
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <>
                {/* Desktop - Green login button */}
                <Button size="sm" className="bg-gradient-primary hover:opacity-90 hidden sm:flex" asChild>
                  <Link to="/auth" className="text-sm">{translations.nav.signIn}</Link>
                </Button>
                {/* Mobile login button */}
                <Button variant="ghost" size="sm" asChild className="sm:hidden text-sm">
                  <Link to="/auth" className="px-2">{translations.nav.signIn}</Link>
                </Button>
              </>
            )}
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="text-primary bg-primary/10 hover:bg-primary/20 p-2 ml-2"
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 border-b border-border/50 bg-background shadow-lg z-50">
            <div className="px-4 py-6 space-y-6">
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
                {user && (
                  <Link 
                    to="/utleie-agent" 
                    className="text-primary hover:text-primary/80 transition-colors font-medium text-lg flex items-center gap-3 py-2 border-t pt-4"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Bot className="h-5 w-5" />
                    Utleie Agent
                  </Link>
                )}
              </nav>
              
              {user && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <Button variant="outline" className="w-full justify-start" size="lg" asChild>
                    <Link to="/min-side" className="flex items-center gap-3" onClick={() => setIsMenuOpen(false)}>
                      <User className="h-5 w-5" />
                      Min side
                    </Link>
                  </Button>
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
                </div>
              )}
              
              {!user && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <Button className="w-full bg-gradient-primary hover:opacity-90" size="lg" asChild>
                    <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                      {translations.nav.signIn}
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;