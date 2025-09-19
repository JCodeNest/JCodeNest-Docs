import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppClientRoot from "@/components/app-client-root";
import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JCodeNest Document",
  description: "沉默老李的技术笔记",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppClientRoot>
          {children}
        </AppClientRoot>
      </body>
    </html>
  );
}
