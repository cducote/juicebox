import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
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
  // ClerkProvider requires publishable key — skip wrapping during static builds
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }

  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
