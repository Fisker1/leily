import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import CallToAction from "@/components/CallToAction";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <CallToAction />
      <Footer />
    </div>
  );
};

export default Index;
