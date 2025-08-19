import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import CalculatorPreview from "@/components/CalculatorPreview";
import CallToAction from "@/components/CallToAction";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/contexts/LanguageContext";

const Index = () => {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background">
        <Navigation />
        <Hero />
        <Features />
        <CalculatorPreview />
        <CallToAction />
        <Footer />
      </div>
    </LanguageProvider>
  );
};

export default Index;
