import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Affiliate Builder - Générez vos sites affiliés en 60 secondes",
  description: "Créez des pages de review affiliées optimisées pour la conversion en un seul clic. L'IA génère le contenu, les images et le design professionnel automatiquement.",
  keywords: ["affiliation", "site affilié", "IA", "générateur", "revenus passifs", "marketing", "review", "produit", "automation"],
  authors: [{ name: "AI Affiliate Builder" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "AI Affiliate Builder - Sites affiliés en 60 secondes",
    description: "Générez automatiquement des pages de review optimisées pour les conversions avec l'IA",
    url: "https://chat.z.ai",
    siteName: "AI Affiliate Builder",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Affiliate Builder",
    description: "Générez vos sites affiliés en 60 secondes avec l'IA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a1a] text-white`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
