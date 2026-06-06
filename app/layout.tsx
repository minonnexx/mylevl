import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
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
      </body>
    </html>
  );
}
