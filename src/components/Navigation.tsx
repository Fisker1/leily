import { Button } from "@/components/ui/button";

const Navigation = () => {
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
                Features
              </a>
              <a href="#calculator" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Calculator
              </a>
              <a href="#about" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                About
              </a>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
            <Button size="sm" className="bg-gradient-primary hover:opacity-90">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;