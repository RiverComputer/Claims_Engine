import type { Metadata } from "next";
import "./globals.css";
import { isPrototype3, prototypeLabel } from "@/lib/prototype";

export const metadata: Metadata = {
  title: isPrototype3 ? "Claims Engine v3 (Prototype)" : "Claims Engine v2",
  description: "Graph-based claim construction interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {isPrototype3 && (
          <div className="w-full bg-amber-100 text-amber-900 text-xs font-semibold tracking-wide uppercase text-center py-1">
            {prototypeLabel} Mode
          </div>
        )}
        {children}
      </body>
    </html>
  );
}

