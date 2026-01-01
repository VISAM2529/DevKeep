"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Code2,
  Shield,
  Terminal,
  FileText,
  Lock,
  Zap,
  ArrowRight,
  Github,
  ChevronRight,
  Users,
  MessageSquare,
  CheckCircle2,
  Clock,
  Kanban,
  Calendar,
  Sparkles,
  Check,
  X
} from "lucide-react";

export default function Home() {
  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for individual developers",
      features: [
        "Up to 3 projects",
        "Basic credential vault",
        "Command snippets",
        "Notes with markdown",
        "Community access (1)",
        "Email support"
      ],
      limitations: [
        "No team collaboration",
        "No attendance tracking",
        "Limited storage (1GB)"
      ],
      cta: "Start Free",
      variant: "outline" as const,
      popular: false
    },
    {
      name: "Pro",
      price: "$12",
      period: "per month",
      description: "For professional developers and small teams",
      features: [
        "Unlimited projects",
        "Advanced AES-256 vault",
        "Unlimited snippets & notes",
        "Rich text editor",
        "Up to 5 communities",
        "Team collaboration",
        "Task management with timeline",
        "Real-time chat",
        "Priority support",
        "10GB storage"
      ],
      limitations: [],
      cta: "Start Pro Trial",
      variant: "premium" as const,
      popular: true
    },
    {
      name: "Enterprise",
      price: "$49",
      period: "per month",
      description: "For large teams and organizations",
      features: [
        "Everything in Pro",
        "Unlimited communities",
        "Attendance tracking & analytics",
        "Advanced team permissions",
        "SSO & SAML integration",
        "Custom integrations",
        "Dedicated support",
        "99.99% SLA",
        "Unlimited storage",
        "On-premise deployment option"
      ],
      limitations: [],
      cta: "Contact Sales",
      variant: "default" as const,
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-40 animate-mesh" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-electric-purple/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Code2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-glow">DevKeep</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link href="#security" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Security</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:inline-flex">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button variant="premium">Get Started <ChevronRight className="ml-1 h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="container mx-auto px-6 text-center space-y-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Sparkles className="h-4 w-4 fill-current" />
            <span>The Complete Developer Workspace</span>
          </div>

          {/* Title */}
          <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              Your Team's <span className="bg-gradient-to-r from-primary via-cyber-blue to-electric-purple bg-clip-text text-transparent italic">Command Center</span> for Development
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
              Projects, Tasks, Attendance, Chat, and Secure Vaults - all in one beautiful workspace. Built for modern development teams.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" variant="premium" className="w-full h-14 text-lg">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="https://github.com" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full h-14 text-lg gap-2">
                <Github className="h-5 w-5" /> Star on GitHub
              </Button>
            </Link>
          </div>

          {/* Feature Preview */}
          <div className="relative mt-20 max-w-5xl mx-auto p-2 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-sm animate-in zoom-in duration-1000 delay-700">
            <div className="rounded-[1.25rem] overflow-hidden border border-white/10 bg-card/80">
              <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-white/40 font-mono tracking-widest">DEVKEEP-WORKSPACE</span>
                </div>
              </div>
              <div className="p-8 aspect-video flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-electric-purple/5">
                <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
                  {[
                    { icon: Kanban, label: "Projects", color: "text-primary" },
                    { icon: Users, label: "Communities", color: "text-cyber-blue" },
                    { icon: MessageSquare, label: "Chat", color: "text-electric-purple" },
                    { icon: Calendar, label: "Tasks", color: "text-neon-green" },
                    { icon: Clock, label: "Attendance", color: "text-yellow-500" },
                    { icon: Lock, label: "Vault", color: "text-red-500" }
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                      <item.icon className={cn("h-8 w-8", item.color)} />
                      <span className="text-xs font-medium text-white/70">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-white/5 bg-white/[0.01]">
        <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Active Teams", val: "10K+" },
            { label: "Projects Managed", val: "500K+" },
            { label: "Uptime", val: "99.99%" },
            { label: "Countries", val: "120+" }
          ].map((stat, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="text-3xl font-black text-glow">{stat.val}</div>
              <div className="text-sm text-muted-foreground uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="container mx-auto px-6 py-32 space-y-20">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Everything Your Team <span className="text-primary italic">Needs.</span></h2>
          <p className="text-muted-foreground text-lg">From project management to secure credential storage - we've got you covered.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Kanban,
              title: "Project Management",
              desc: "Organize projects with tasks, timelines, and team collaboration. Drag-and-drop boards included.",
              color: "text-primary",
              bg: "bg-primary/10"
            },
            {
              icon: Users,
              title: "Communities",
              desc: "Create communities for different teams. Invite members, manage roles, and collaborate seamlessly.",
              color: "text-cyber-blue",
              bg: "bg-cyber-blue/10"
            },
            {
              icon: MessageSquare,
              title: "Real-time Chat",
              desc: "Built-in chat for projects and communities. No more context switching to Slack.",
              color: "text-electric-purple",
              bg: "bg-electric-purple/10"
            },
            {
              icon: Calendar,
              title: "Task Timeline",
              desc: "Gantt-style timeline view with automatic time tracking and completion analytics.",
              color: "text-neon-green",
              bg: "bg-neon-green/10"
            },
            {
              icon: Clock,
              title: "Attendance Tracking",
              desc: "Clock in/out system with daily, weekly, and monthly analytics. Perfect for remote teams.",
              color: "text-yellow-500",
              bg: "bg-yellow-500/10"
            },
            {
              icon: Lock,
              title: "AES-256 Vault",
              desc: "Military-grade encryption for credentials, API keys, and sensitive data.",
              color: "text-red-500",
              bg: "bg-red-500/10"
            },
            {
              icon: Terminal,
              title: "Command Snippets",
              desc: "Store complex Docker, K8s, and Git commands with syntax highlighting.",
              color: "text-cyan-500",
              bg: "bg-cyan-500/10"
            },
            {
              icon: FileText,
              title: "Rich Text Notes",
              desc: "Word-like editor with image uploads, formatting, and markdown support.",
              color: "text-purple-500",
              bg: "bg-purple-500/10"
            },
            {
              icon: Shield,
              title: "Enterprise Security",
              desc: "SSO, 2FA, audit logs, and compliance-ready infrastructure.",
              color: "text-blue-500",
              bg: "bg-blue-500/10"
            }
          ].map((feat, i) => (
            <div key={i} className="group p-8 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300">
              <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg", feat.bg)}>
                <feat.icon className={cn("h-7 w-7", feat.color)} />
              </div>
              <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-6 py-32 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Simple, <span className="text-primary italic">Transparent</span> Pricing</h2>
          <p className="text-muted-foreground text-lg">Start free, upgrade when you need more power. No hidden fees.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, i) => (
            <Card key={i} className={cn(
              "relative p-8 rounded-3xl border transition-all duration-300",
              plan.popular
                ? "border-primary/50 bg-primary/5 shadow-2xl shadow-primary/20 scale-105"
                : "border-white/5 bg-white/[0.02] hover:border-white/10"
            )}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">Most Popular</Badge>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black">{plan.price}</span>
                  <span className="text-muted-foreground">/ {plan.period}</span>
                </div>

                <Link href="/signup" className="block">
                  <Button variant={plan.variant} className="w-full h-12" size="lg">
                    {plan.cta}
                  </Button>
                </Link>

                <div className="space-y-3 pt-6 border-t border-white/10">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  {plan.limitations.map((limitation, idx) => (
                    <div key={idx} className="flex items-start gap-3 opacity-50">
                      <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{limitation}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">All plans include 14-day free trial. No credit card required.</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-32">
        <div className="relative p-12 md:p-24 rounded-[3rem] overflow-hidden border border-primary/20 bg-primary/5 text-center space-y-8">
          <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(circle_at_center,_var(--color-primary)_0%,_transparent_70%)] opacity-10" />
          <h2 className="text-4xl md:text-6xl font-black tracking-tight max-w-2xl mx-auto">
            Ready to <span className="text-primary italic">Transform</span> Your Workflow?
          </h2>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Join thousands of teams building better software with DevKeep.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" variant="premium" className="h-14 px-12 text-lg">
                Start Free Trial
              </Button>
            </Link>
            <Link href="#pricing">
              <Button size="lg" variant="outline" className="h-14 px-12 text-lg">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Code2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold tracking-tight">DevKeep</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Twitter</Link>
              <Link href="#" className="hover:text-foreground transition-colors">GitHub</Link>
            </div>
            <p className="text-sm text-muted-foreground italic">
              © 2026 DevKeep. Built with ❤️ for developers worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
