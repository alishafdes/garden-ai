import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Sprout, Leaf, Droplets, Sun, Calendar, Shield, ArrowRight, Phone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import heroImage from "@/assets/hero-garden.jpg";

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
    description: "Hyper-local guidance — skip watering when it's raining at your house.",
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
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground text-xs py-2">
        <div className="container flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">🌱 Your dream garden, our expert tools</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> support@empathetic-gardener.com
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <Sprout className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-serif font-bold text-xl text-foreground">The Empathetic Gardener</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-sans text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#testimonial" className="hover:text-primary transition-colors">Testimonials</a>
          </div>
          <Link to={user ? "/dashboard" : "/auth"}>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-sans">
              {user ? "Dashboard" : "Get Started"}
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Beautiful garden with professional care"
            className="w-full h-full object-cover"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent" />
        </div>

        <div className="relative container px-4 py-24 md:py-36">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-xl"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 text-accent font-sans text-sm italic mb-4"
            >
              <Sprout className="w-4 h-4" />
              Your dream garden, our expert tools
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold leading-tight text-primary-foreground">
              Expert Garden
              <br />
              & Plant Care
              <br />
              <span className="text-accent">Services</span>
            </h1>

            <p className="mt-6 text-base text-primary-foreground/80 font-sans max-w-md leading-relaxed">
              We manage the mental load of your garden — from thoughtful plant care
              to expert maintenance — always with heart and precision.
            </p>

            <div className="mt-8 flex items-center gap-4">
              <Link to={user ? "/dashboard" : "/auth"}>
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-sans px-8">
                  {user ? "Go to Dashboard" : "Get Started"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-muted border-t-4 border-accent">
        <div className="container px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-foreground">Professional Execution</h2>
            <p className="text-muted-foreground font-sans mt-2">Everything you need to keep your garden thriving</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="p-6 rounded-xl bg-card border border-border hover:shadow-lg hover:border-primary/30 transition-all text-center"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-accent/20 flex items-center justify-center">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-serif font-semibold text-lg text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 font-sans">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section id="testimonial" className="bg-primary text-primary-foreground">
        <div className="container px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-lg mx-auto"
          >
            <Sun className="w-8 h-8 text-accent mx-auto mb-4" />
            <blockquote className="text-xl font-serif italic text-primary-foreground">
              "I spent my entire Saturday and half my paycheck at the nursery. I just need an app
              that tells me exactly what to do so I don't kill everything by July."
            </blockquote>
            <p className="text-sm text-primary-foreground/70 mt-4 font-sans">
              — Maya, Suburban Newbie Homeowner
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground py-10">
        <div className="container px-4 text-center text-sm text-background/60 font-sans">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sprout className="w-4 h-4 text-accent" />
            <span className="font-serif font-bold text-background">The Empathetic Gardener</span>
          </div>
          <p>© 2026 The Empathetic Gardener. Built for gardeners who refuse to give up.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
