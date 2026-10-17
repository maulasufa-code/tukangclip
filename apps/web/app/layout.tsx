import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-archivo"
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
    <html lang="id" className={archivo.variable}>
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
