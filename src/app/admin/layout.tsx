import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono, Frank_Ruhl_Libre } from "next/font/google";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const frankRuhl = Frank_Ruhl_Libre({
  variable: "--font-frank-ruhl",
  subsets: ["latin", "hebrew"],
});

export const metadata: Metadata = {
  title: "ניהול - 770 Apartments",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} ${frankRuhl.variable} h-full antialiased`}
    >
      <body className="admin-ui min-h-full bg-canvas">{children}</body>
    </html>
  );
}
