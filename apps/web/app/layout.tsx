import type { Metadata } from "next";
import { Archivo, DM_Mono, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-archivo"
});

const display = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
  variable: "--font-display"
});

const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "TukangClip",
  description: "Potong video panjang jadi klip vertikal. Otomatis atau lewat editor."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${archivo.variable} ${display.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-kertas text-tinta antialiased">
        <a
          href="#isi"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded focus:bg-white focus:px-3 focus:py-2"
        >
          Lewati ke isi
        </a>
        {children}
      </body>
    </html>
  );
}
