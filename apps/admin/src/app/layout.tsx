import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Juicebox Studios — Admin",
  description: "Internal management dashboard for Juicebox Studios",
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
