import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { GAME_NAME } from "@/game/brand";

export const metadata: Metadata = {
  title: GAME_NAME,
  description: "A night-fishing game on Robinhood Chain. Free-play beta.",
};

export const viewport: Viewport = {
  themeColor: "#050816",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
