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
        {/* Adsterra Popunder Ad */}
        <script src="https://pl28432581.effectivegatecpm.com/fb/78/5e/fb785e0cb2214d69623a3fae79611bfb.js" async></script>
      </body>
    </html>
  );
}
