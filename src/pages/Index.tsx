import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import ExampleReport from "@/components/ExampleReport";
import PricingOverview from "@/components/PricingOverview";
import Footer from "@/components/Footer";

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
