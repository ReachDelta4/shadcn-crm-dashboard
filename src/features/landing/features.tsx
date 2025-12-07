"use client";

import {
  BrainCircuit,
  Ear,
  FileCheck,
  Globe,
  LineChart,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const features = [
  {
    title: "Live Assist (Whisper)",
    description: "Instant one‑line prompts and suggested scripts during live calls.",
    icon: <Ear className="h-6 w-6" />,
    className: "md:col-span-2",
  },
  {
    title: "Real‑time Signal Index",
    description: "Continuous scoring of intent, budget, timeline, and authority.",
    icon: <Zap className="h-6 w-6" />,
    className: "md:col-span-1",
  },
  {
    title: "Auto‑Generated Playbooks",
    description: "The system learns from winning calls and suggests tailored playbooks for similar prospects.",
    icon: <BrainCircuit className="h-6 w-6" />,
    className: "md:col-span-1",
  },
  {
    title: "Conversation Health",
    description: "Monitor talk:listening ratios, interruptions, and filler words in real-time.",
    icon: <LineChart className="h-6 w-6" />,
    className: "md:col-span-2",
  },
  {
    title: "Deal Intelligence",
    description: "Maps call highlights to pipeline stages and recommends next best actions automatically.",
    icon: <Sparkles className="h-6 w-6" />,
    className: "md:col-span-2",
  },
  {
    title: "Enterprise Compliance",
    description: "PII detection, recording controls, and regional compliance toggles built-in.",
    icon: <ShieldCheck className="h-6 w-6" />,
    className: "md:col-span-1",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-primary uppercase tracking-wide">
            Key Features
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to <br /> dominates sales conversations.
          </p>
          <p className="text-muted-foreground mt-6 text-lg leading-8">
            From real-time guidance to post-call forensics, Salesy is the complete operating system for modern sales teams.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-3">
          {features.map((feature, i) => (
            <SpotlightCard key={i} className={feature.className}>
              <div className="relative z-10 p-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground mt-2">{feature.description}</p>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function SpotlightCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/50 bg-background/50 hover:border-primary/50 transition-colors duration-300",
        className
      )}
    >
      <div className="absolute inset-0 z-0 bg-transparent transition-opacity duration-500 group-hover:opacity-100 opacity-0"
        style={{
          background: "radial-gradient(600px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(var(--primary-rgb), 0.15), transparent 40%)"
        }}
      />
      <div
        className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
          e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);

          // Also set on parent for the gradient above if needed, but here we can just do it inline
          const parent = e.currentTarget.parentElement;
          if (parent) {
            parent.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
            parent.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
          }
        }}
      />
      {children}
    </motion.div>
  );
}
