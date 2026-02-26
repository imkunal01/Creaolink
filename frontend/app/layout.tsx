import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CreaoLink",
  description: "CreaoLink",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg text-text-primary antialiased">{children}</body>
    </html>
  );
}
