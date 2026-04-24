import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-2c5f94f606da414798fc9db7cc4413ec.r2.dev",
      },
      {
        protocol: "https",
        hostname: "cdn.infinitearebetterthanone.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
