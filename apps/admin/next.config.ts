import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  transpilePackages: [
    "@juicebox/ui",
    "@juicebox/db",
    "@juicebox/api",
    "@juicebox/auth",
    "@juicebox/stripe",
    "@juicebox/email",
    "@juicebox/storage",
  ],
};

export default nextConfig;
