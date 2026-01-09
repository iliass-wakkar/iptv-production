import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import DevToolsBlocker from "@/components/DevToolsBlocker";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "IPTV Player - Live TV Streaming",
  description: "Watch live TV channels for free. Sports, movies, news and more.",
  keywords: "IPTV, live TV, streaming, sports, movies, free TV",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "IPTV Player - Live TV Streaming",
    description: "Watch live TV channels for free. Sports, movies, news and more.",
    images: ["/logo.png"],
  },
  other: {
    d28fe201288e6d5c647fada97bc63659cd47da62: "d28fe201288e6d5c647fada97bc63659cd47da62",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DevToolsBlocker />
        {children}
      </body>
    </html>
  );
}
