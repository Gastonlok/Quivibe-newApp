import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import "@/styles/globals.css";
import "@/styles/theme.css";
import "leaflet/dist/leaflet.css";
import { Navbar } from "@/components/navbar";
import { PageNavigation } from "@/components/page-navigation";
import { Footer } from "@/components/footer";
import { PublicChrome } from "@/components/public-chrome";
import { SessionProvider } from "next-auth/react";
import { siteUrl } from "@/lib/site";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-noto-sans",
});

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
    <html lang="fr" className={notoSans.variable}>
      <body className="flex min-h-screen flex-col bg-gray-50 text-gray-950">
        <SessionProvider>
          <PublicChrome>
            <Navbar />
            <PageNavigation />
          </PublicChrome>
          <div className="flex-1">{children}</div>
          <PublicChrome>
            <Footer />
          </PublicChrome>
        </SessionProvider>
      </body>
    </html>
  );
}
