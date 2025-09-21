import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppClientRoot from "@/components/app-client-root";
import "./globals.css";
import { siteConfig } from "@/config/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // 标题与描述
  title: siteConfig.seo.title,
  description: siteConfig.seo.description,
  // 关键词与作者
  keywords: siteConfig.seo.keywords,
  authors: siteConfig.seo.authors,
  // 主题色
  themeColor: siteConfig.seo.themeColor,
  // Open Graph
  openGraph: siteConfig.seo.openGraph,
  // Twitter 卡片
  twitter: siteConfig.seo.twitter,
  // 浏览器标签图标
  icons: {
    icon: siteConfig.seo.icons?.favicon,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <html lang="zh-CN" suppressHydrationWarning>
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
