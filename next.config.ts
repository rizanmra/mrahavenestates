import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.173"],
  // Keep these out of the serverless bundle — bundling firebase-admin/nodemailer
  // has been crashing Vercel routes with empty HTTP 500s.
  serverExternalPackages: ["firebase-admin", "nodemailer"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "www.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "*.firebasestorage.app",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/free-valuation",
        destination: "/property-value-calculator",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
