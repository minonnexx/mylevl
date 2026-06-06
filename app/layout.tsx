import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import InstallBannerWrapper from "@/components/pwa/InstallBannerWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "mylevl",
  description: "Sube de nivel en la vida real",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "mylevl",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <InstallBannerWrapper />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--color-surface)',
              border: '0.5px solid color-mix(in srgb, var(--color-text-muted) 25%, transparent)',
              color: 'var(--color-text-primary)',
              borderRadius: 'var(--radius-component)',
              fontSize: '13px',
            },
          }}
        />
      </body>
    </html>
  );
}
