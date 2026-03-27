import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Sprout, Leaf, Droplets, Sun, Calendar, Shield, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const features = [
  {
    icon: Leaf,
    title: "Plant Identification",
    description: "Scan and identify your plants instantly with AI-powered recognition.",
  },
  {
    icon: Calendar,
    title: "Smart Calendar",
    description: "Weather-synced maintenance schedule that adapts to local conditions.",
  },
  {
    icon: Droplets,
    title: "Watering Alerts",
    description: "\"It's raining at your house—skip watering today.\" Hyper-local guidance.",
  },
  {
    icon: Shield,
    title: "Health Monitoring",
    description: "Early warning alerts for pests and diseases before your plants suffer.",
  },
];

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="container flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Sprout className="w-5 h-5 text-primary" />
          </div>
          <span className="font-serif font-bold text-lg">The Empathetic Gardener</span>
        </div>
        <Link to={user ? "/dashboard" : "/auth"}>
          <Button variant="outline" size="sm">
            {user ? "Dashboard" : "Sign In"}
          </Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="container px-4 pt-16 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl mx-auto text-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-sans mb-6"
          >
            <Sprout className="w-4 h-4" />
            Your garden's personal co-pilot
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold leading-tight text-foreground">
            Stop worrying.
            <br />
            <span className="text-primary">Start growing.</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground font-sans max-w-lg mx-auto leading-relaxed">
            The Empathetic Gardener manages the mental load of your garden — so you can enjoy it
            instead of stressing over it.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link to={user ? "/dashboard" : "/auth"}>
              <Button size="lg" className="font-sans">
                {user ? "Go to Dashboard" : "Get Started Free"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="container px-4 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-card border border-border hover:border-primary/20 transition-colors"
            >
              <feature.icon className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-serif font-semibold text-lg">{feature.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 font-sans">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="container px-4 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-lg mx-auto"
        >
          <Sun className="w-8 h-8 text-accent mx-auto mb-4" />
          <blockquote className="text-lg font-serif italic text-foreground">
            "I spent my entire Saturday and half my paycheck at the nursery. I just need an app
            that tells me exactly what to do so I don't kill everything by July."
          </blockquote>
          <p className="text-sm text-muted-foreground mt-3 font-sans">
            — Maya, Suburban Newbie Homeowner
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container px-4 text-center text-sm text-muted-foreground font-sans">
          <p>© 2026 The Empathetic Gardener. Built for gardeners who refuse to give up.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
