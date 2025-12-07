"use client";

import { Check, X } from "lucide-react";
import { motion } from "framer-motion";

const MotionDiv: any = motion.div;

export function ProblemSolution() {
    return (
        <section className="bg-muted/30 relative py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-base font-semibold leading-7 text-primary uppercase tracking-wide">
                        Why you’re losing deals
                    </h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                        Stop relying on post-call coaching. <br />
                        <span className="text-muted-foreground">It&apos;s too late.</span>
                    </p>
                </div>

                <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-2">
                    {/* The Hard Way */}
                    <MotionDiv
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="rounded-3xl border border-red-200 bg-red-50/50 p-8 ring-1 ring-red-200 dark:bg-red-950/20 dark:border-red-900/50 dark:ring-red-900/30 xl:p-10"
                    >
                        <h3 className="text-lg font-semibold leading-8 text-foreground">
                            The Old Way
                        </h3>
                        <p className="mt-4 text-sm leading-6 text-muted-foreground">
                            Reps are left to fend for themselves during the call, and feedback comes too late to save the deal.
                        </p>
                        <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-muted-foreground">
                            {[
                                "Lost buying signals (tone, hesitations)",
                                "Slow feedback loop (coaching after the fact)",
                                "Inconsistent playbook execution",
                                "Poor visibility into seller performance",
                                "Long ramp time for new hires",
                            ].map((feature) => (
                                <li key={feature} className="flex gap-x-3">
                                    <X className="h-6 w-5 flex-none text-red-600" aria-hidden="true" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </MotionDiv>

                    {/* The Salesy Way */}
                    <div className="rounded-3xl border border-primary/20 bg-background p-8 ring-1 ring-primary/20 shadow-2xl xl:p-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-primary/20 blur-2xl rounded-full"></div>

                        <h3 className="text-lg font-semibold leading-8 text-primary">
                            The Salesy Way
                        </h3>
                        <p className="mt-4 text-sm leading-6 text-muted-foreground">
                            Real-time AI that guides your reps while they are on the phone, turning every objection into an opportunity.
                        </p>
                        <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-foreground">
                            {[
                                "Real‑time whisper guidance during calls",
                                "Instant signal surfacing (budget, urgency)",
                                "Auto-suggested rebuttals & playbooks",
                                "Forensic post‑call audits with action items",
                                "Objective, data-driven coaching dashboards",
                            ].map((feature) => (
                                <li key={feature} className="flex gap-x-3">
                                    <Check className="h-6 w-5 flex-none text-primary" aria-hidden="true" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
