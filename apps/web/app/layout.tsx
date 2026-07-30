import type { Metadata } from "next";
import "../styles/globals.css";

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
      <body>{children}</body>
    </html>
  );
}
