import type { Metadata } from "next";
import "@/app/globals.css";
import AuthGuard from "@/components/AuthGuard";
import CookieBanner from "@/components/CookieBanner";

export const metadata: Metadata = {
  title: "CRM | Unum People",
  description: "Gestão inteligente de leads e tráfego",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-gray-50 text-gray-900">
        <AuthGuard>
          {children}
        </AuthGuard>
        <CookieBanner />
      </body>
    </html>
  );
}
