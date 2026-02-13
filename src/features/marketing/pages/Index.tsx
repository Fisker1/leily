import Navigation from "@/shared/components/Navigation";
import Hero from "@/features/marketing/components/Hero";
import ExampleReport from "@/features/marketing/components/ExampleReport";
import PricingOverview from "@/features/marketing/components/PricingOverview";
import Footer from "@/features/marketing/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <ExampleReport />
      <PricingOverview />
      <Footer />
    </div>
  );
};

export default Index;
