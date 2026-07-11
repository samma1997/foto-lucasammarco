import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/do9hrcwn1/**",
      },
    ],
  },
  // vecchi URL italiani → nuovi inglesi (non rompe link esistenti)
  async redirects() {
    return [
      { source: "/fotografie", destination: "/photography", permanent: true },
      { source: "/fotografie/:slug", destination: "/photography/:slug", permanent: true },
      { source: "/chi-sono", destination: "/about", permanent: true },
    ];
  },
};

export default nextConfig;
