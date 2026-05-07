import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "$RAT — RatWifHanta",
  description: "the rat that broke containment. a memecoin on solana. spread the hanta. play the game.",
  openGraph: {
    title: "$RAT — RatWifHanta",
    description: "the rat that broke containment. spread the hanta.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@RatWifHanta",
    title: "$RAT — RatWifHanta",
    description: "the rat that broke containment. spread the hanta.",
  },
};

export const viewport: Viewport = {
  themeColor: "#F0E7D4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Nunito:wght@400;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="overflow-x-hidden">{children}</body>
    </html>
  );
}
