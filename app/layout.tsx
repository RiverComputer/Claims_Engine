import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claims Engine v2",
  description: "Graph-based claim construction interface",
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

