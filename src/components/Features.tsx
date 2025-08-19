import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, TrendingUp, FileText, BarChart3, DollarSign, Building } from "lucide-react";

const features = [
  {
    icon: Calculator,
    title: "Advanced Calculator",
    description: "Comprehensive property analysis with rental yield, cash flow, and ROI calculations."
  },
  {
    icon: TrendingUp,
    title: "Yield Analysis",
    description: "Calculate gross and net rental yields to evaluate investment potential."
  },
  {
    icon: FileText,
    title: "PDF Reports",
    description: "Generate professional reports for banks, investors, and stakeholders."
  },
  {
    icon: BarChart3,
    title: "Market Comparison",
    description: "Compare properties against market averages and similar investments."
  },
  {
    icon: DollarSign,
    title: "Cash Flow Tracking",
    description: "Monitor monthly cash flow, expenses, and profitability over time."
  },
  {
    icon: Building,
    title: "Portfolio Management",
    description: "Manage multiple properties and track overall portfolio performance."
  }
];

const Features = () => {
  return (
    <section id="features" className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Everything You Need for
            <span className="text-primary block">Property Analysis</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional-grade tools to analyze, evaluate, and report on property investments 
            with bank-ready documentation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="shadow-soft hover:shadow-medium transition-shadow duration-300 border-0 bg-card">
              <CardHeader>
                <div className="p-3 bg-primary-soft rounded-xl w-fit mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;