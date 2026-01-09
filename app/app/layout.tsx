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
  other: {
    monetag: "3f95202df91ca8910352e54b244fad81",
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
