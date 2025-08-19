import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "./LanguageToggle";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-primary">PropertyCalc</h1>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a href="#features" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                {t.features}
              </a>
              <a href="#calculator" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                {t.calculator}
              </a>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <LanguageToggle />
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
            <Button size="sm" className="bg-gradient-primary hover:opacity-90">
              {t.startAnalysis}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="px-4 py-6 space-y-6">
              <nav className="flex flex-col space-y-4">
                <a href="#features" className="text-muted-foreground hover:text-primary transition-colors font-medium text-lg">
                  {t.features}
                </a>
                <a href="#calculator" className="text-muted-foreground hover:text-primary transition-colors font-medium text-lg">
                  {t.calculator}
                </a>
              </nav>
              <div className="space-y-4">
                <LanguageToggle />
                <Button className="w-full" size="lg">
                  {t.startAnalysis}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;