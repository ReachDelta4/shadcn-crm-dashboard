import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";

import { ThemeProvider } from "@/providers/theme-provider";
import { PerfMarksProvider } from "@/components/perf/perf-marks-provider";

import "./globals.css";

export const runtime = "nodejs";

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
          {children}
          <PerfMarksProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
