import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "À table !",
  description: "Mon placard intelligent et mes menus du soir pour trois.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="preload" as="image" href="/food-mosaic.webp" type="image/webp" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
