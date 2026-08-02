// apps/web/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**", // Autorise tous les chemins sur Cloudinary
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/seed/**", // Autorise uniquement les images de seed
      },
    ],
  },
};

export default nextConfig;
