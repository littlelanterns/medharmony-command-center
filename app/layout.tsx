import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedHarmony Command Center",
  description: "Harmonized Care, Simplified Scheduling",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
