import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// --- UPDATE METADATA MANDALIKA ---
export const metadata: Metadata = {
  title: "MANDALIKA - MDT",
  description: "Official Mobile Data Terminal Mandalika Police Department",
  icons: {
    icon: "/logo-polisi.png", // <--- Arahkan ke file logo Jendral
    shortcut: "/logo-polisi.png",
    apple: "/logo-polisi.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id" // Ganti ke Indonesia agar SEO lebih tajam
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#E0E7FF]">
        {children}
      </body>
    </html>
  );
}