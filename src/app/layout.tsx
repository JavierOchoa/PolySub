import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Subtitle Context Translator",
  description: "Translate subtitle files in contextual chunks with your own AI API key.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
