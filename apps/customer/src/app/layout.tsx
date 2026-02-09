import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Juicebox Studios — Client Portal",
  description: "Manage your project with Juicebox Studios",
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
