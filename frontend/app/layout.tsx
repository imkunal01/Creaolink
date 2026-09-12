import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CreaoLink — Creative Review & Premiere Pro Sync Workspace",
  description: "Collaborative project management, version review, and real-time Premiere Pro timeline sync for creative teams and video editors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans bg-[#08090a] text-[#f4f4f5] antialiased selection:bg-[#00e5ff]/20 selection:text-[#00e5ff]`}>
        {children}
      </body>
    </html>
  );
}
