"use client";

// External imports
import Link from "next/link";
import { ArrowRight, LineChart, TrendingUp, Users } from "lucide-react";
import { motion } from "framer-motion";

// Internal imports
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * HeroTitle component displaying the main heading with styled text
 */
const HeroTitle = () => {
    return (
        <div className="relative">
            <h1 className="inline-block max-w-6xl leading-none font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                <div className="relative mb-3 pb-2 text-center text-4xl sm:text-5xl md:mb-5 md:text-6xl">
                    <span className="inline-block">REAL-TIME AI THAT TURNS</span>
                </div>
                <div className="mt-1 block text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
                    <span className="bg-primary text-primary-foreground relative inline-block px-4 py-1">
                        EVERY SALES CALL
                    </span>
                    <span className="text-foreground ml-2 inline-block uppercase">
                        INTO REVENUE
                    </span>
                </div>
            </h1>
        </div>
    );
};

/**
 * BadgeLabel component for displaying feature announcement badges
 */
const BadgeLabel = ({ text }: { text: string }) => {
    return (
        <div
            className="border-border bg-background mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
            role="note"
        >
            <span
                className="bg-primary flex h-2 w-2 rounded-full"
                aria-hidden="true"
            ></span>
            <span className="text-muted-foreground text-xs font-medium">{text}</span>
        </div>
    );
};

/**
 * CTAButton component for consistent call-to-action buttons
 */
const CTAButton = ({
    children,
    variant = "default",
    href,
    icon,
}: {
    children: React.ReactNode;
    variant?: "default" | "outline";
    href?: string;
    icon?: React.ReactNode;
}) => {
    const buttonClass = cn(
        "h-16 px-8 text-base font-semibold tracking-wide uppercase sm:text-lg",
        variant === "outline" && "hover:bg-background/5 border-2",
    );

    const button = (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button size="lg" variant={variant as any} className={buttonClass}>
                {icon && (
                    <span
                        className="bg-primary-foreground/10 mr-3 -ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full"
                        aria-hidden="true"
                    >
                        {icon}
                    </span>
                )}
                {children}
            </Button>
        </motion.div>
    );

    if (href) {
        return <Link href={href}>{button}</Link>;
    }

    return button;
};

/**
 * Main Hero component combining all elements
 */
export function Hero() {
    return (
        <section
            className="relative overflow-hidden"
            id="home"
            aria-labelledby="hero-heading"
        >
            {/* Background elements */}
            <div
                className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"
                aria-hidden="true"
            ></div>
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute top-0 right-0 -z-10 h-64 w-64 rounded-full bg-yellow-400/20 blur-3xl md:h-96 md:w-96"
                aria-hidden="true"
            ></motion.div>
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.6, 0.3],
                    x: [0, 20, 0],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                }}
                className="bg-primary/20 absolute bottom-16 left-0 -z-10 h-64 w-64 rounded-full blur-3xl md:h-96 md:w-96"
                aria-hidden="true"
            ></motion.div>

            <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-32 sm:px-6 sm:py-40 md:min-h-screen lg:min-h-screen lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex flex-col items-center text-center"
                >
                    <BadgeLabel text="New: Analytics Dashboard 2.0" />

                    <HeroTitle />

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="text-muted-foreground mt-8 max-w-2xl text-center text-lg"
                    >
                        Live guidance, instant signals, and forensic post‑call audits.
                        The only AI that attaches to your calls and closes deals for you.
                    </motion.p>

                    <div className="relative mt-12 flex flex-col gap-5 sm:flex-row sm:gap-6">
                        {/* Decorative elements around buttons */}
                        <div
                            className="border-primary/30 absolute -top-4 -left-4 h-4 w-4 border-t-2 border-l-2"
                            aria-hidden="true"
                        ></div>
                        <div
                            className="border-primary/30 absolute -right-4 -bottom-4 h-4 w-4 border-r-2 border-b-2"
                            aria-hidden="true"
                        ></div>

                        <CTAButton
                            href="https://github.com/ReachDelta4/salesy-downloads/releases/download/v0.2.4/Salesy.AI.Setup.0.2.4.exe"
                            icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                        >
                            DOWNLOAD FOR WINDOWS
                        </CTAButton>

                        <CTAButton variant="outline">BOOK A DEMO</CTAButton>
                    </div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 1 }}
                        className="text-muted-foreground mt-4 text-sm"
                    >
                        Latest Version v0.2.4 • Windows 10/11
                    </motion.p>

                    {/* Stats bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.8 }}
                        className="border-border/50 bg-background/50 mt-16 flex flex-wrap items-center justify-center gap-6 rounded-lg border p-4 sm:gap-10 md:gap-16 backdrop-blur-sm"
                        aria-label="Key statistics"
                    >
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                                <TrendingUp
                                    className="text-primary h-4 w-4"
                                    aria-hidden="true"
                                />
                                <p className="text-lg font-bold">245%</p>
                            </div>
                            <p className="text-muted-foreground text-xs">
                                Lead conversion rate
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                                <LineChart
                                    className="h-4 w-4 text-yellow-500"
                                    aria-hidden="true"
                                />
                                <p className="text-lg font-bold">3.8M</p>
                            </div>
                            <p className="text-muted-foreground text-xs">
                                Customer interactions
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                                <Users className="h-4 w-4 text-green-500" aria-hidden="true" />
                                <p className="text-lg font-bold">15k+</p>
                            </div>
                            <p className="text-muted-foreground text-xs">
                                Companies onboarded
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
