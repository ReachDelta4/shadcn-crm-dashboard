import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";

import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/providers/theme-provider";
import { CommandPaletteProvider, CommandPalette } from "@/components/command-palette";

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
          <CommandPaletteProvider>
            <TooltipProvider>
              {children}
              <CommandPalette />
            </TooltipProvider>
          </CommandPaletteProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
