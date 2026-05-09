import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import AuthGuard from "@/components/AuthGuard";
import CookieBanner from "@/components/CookieBanner";

export const viewport: Viewport = {
  themeColor: "#3D5D97",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "CRM | Unum People",
  description: "Gestão inteligente de leads e tráfego",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Unum CRM",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  formatDetection: {
    telephone: false,
  },
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    // Registro silencioso em produção
                  }).catch(function(err) {
                    console.error('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
