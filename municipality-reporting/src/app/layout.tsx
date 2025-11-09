import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Limpopo Provincial Government Portal",
  description:
    "Peace, Unity and Prosperity - Official portal for Limpopo Provincial Government services",
};

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
