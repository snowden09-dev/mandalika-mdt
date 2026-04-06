import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MaintenanceGuard from "./dashboard/components/MaintenanceGuard"; // <--- Import Penjaga

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MANDALIKA - MDT",
  description: "Official Mobile Data Terminal Mandalika Police Department",
  icons: {
    icon: "/logo-polisi.png",
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
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#E0E7FF]">
        {/* Bungkus semua children dengan Guard agar pengecekan global */}
        <MaintenanceGuard>
          {children}
        </MaintenanceGuard>
      </body>
    </html>
  );
}