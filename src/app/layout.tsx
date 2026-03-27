import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sarah — Dein AI Sales Agent für den DACH-Markt",
  description:
    "Sarah findet automatisch die besten Leads für dein Unternehmen. KI-gestützte Website-Analyse, Lead-Discovery und intelligentes Scoring.",
  openGraph: {
    title: "Sarah — AI Sales Agent für den DACH-Markt",
    description:
      "Automatische Lead-Discovery, KI-Scoring und klare Handlungsempfehlungen für B2B Sales Teams.",
    type: "website",
    locale: "de_AT",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sarah — AI Sales Agent für den DACH-Markt",
    description: "Automatische Lead-Discovery und KI-Scoring für den DACH-Markt.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de-AT" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
