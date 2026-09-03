import type { Metadata } from "next";
import "@/styles/globals.css";
import "@/styles/theme.css";
import "leaflet/dist/leaflet.css";
import { Navbar } from "@/components/navbar";
import { PageNavigation } from "@/components/page-navigation";
import { Footer } from "@/components/footer";
import { SessionProvider } from "next-auth/react";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Quivibe — Réservez les meilleures tables de Kinshasa",
  description:
    "Découvrez, comparez et réservez restaurants, bars, lounges et expériences à Kinshasa.",
  icons: {
    icon: "/brand/quivibe-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col bg-gray-50 text-gray-950">
        <SessionProvider>
          <Navbar />
          <PageNavigation />
          <div className="flex-1">{children}</div>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
