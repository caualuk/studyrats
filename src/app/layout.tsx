import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "StudyRats",
    template: "%s · StudyRats",
  },
  description:
    "Todo check-in vem com foto. Sem foto, não conta. Acompanhe sua sequência de estudos com a comunidade StudyRats.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg text-white">{children}</body>
    </html>
  );
}
