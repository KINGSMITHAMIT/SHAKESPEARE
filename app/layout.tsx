import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./library.css";
export const metadata: Metadata = {
  title: "The Bard’s Quill — Give your words a little theatre",
  description:
    "Turn everyday English into Shakespeare-inspired prose. Translate offline or with AI.",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#151718" };
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
