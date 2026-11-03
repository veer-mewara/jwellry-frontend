import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security-headers";

const apiOrigin = new URL(process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000");
const apiProtocol = apiOrigin.protocol === "https:" ? "https" : "http";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  images: {
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    remotePatterns: [
      {
        protocol: "https",
        hostname: apiOrigin.hostname,
        port: apiOrigin.port,
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: apiOrigin.hostname,
        port: apiOrigin.port,
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "jwellry-backend.onrender.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "jwellry-backend.onrender.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders(),
      },
    ];
  },
};

export default nextConfig;
