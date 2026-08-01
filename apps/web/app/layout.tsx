import type { Metadata } from "next";
import "../styles/globals.css";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Quivibe — Où sortir à Kinshasa",
  description:
    "Quivibe aide les Congolais à découvrir où sortir : restaurants, bars, lounges et événements.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
