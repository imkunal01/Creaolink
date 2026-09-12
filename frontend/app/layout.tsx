import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientProviders from "./components/ClientProviders";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Creaolink — Creative Timeline & Premiere Pro Sync Workspace",
  description: "Real-time Adobe Premiere Pro timeline bridge and client video review platform. Sync active sequences, drop frame-accurate annotations, and approve cuts without rendering heavy exports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${plusJakarta.variable} ${geistMono.variable} font-sans bg-[#07080a] text-[#f4f4f5] antialiased selection:bg-white/20 selection:text-white`}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
