import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import dynamic from "next/dynamic";

import "./globals.css";

export const runtime = "nodejs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import { CommandPaletteProvider } from "@/components/command-palette";
const CommandPalette = dynamic(() => import("@/components/command-palette").then(m => m.CommandPalette));

export const metadata: Metadata = {
  title: "Salesy - Customer Relationship Management",
  description:
    "CRM dashboard for managing customer relationships using Next.js, Shadcn UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistMono.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <CommandPaletteProvider>
              <TooltipProvider>
                {children}
                <CommandPalette />
              </TooltipProvider>
            </CommandPaletteProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
