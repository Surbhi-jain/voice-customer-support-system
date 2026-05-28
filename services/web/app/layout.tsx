import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voice Support (Phase 1)",
  description: "Free local voice customer support demo with mic and speakers",
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
