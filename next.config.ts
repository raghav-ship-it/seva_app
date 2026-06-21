import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  allowedDevOrigins: ['192.168.13.221'],
  // Images must use unoptimized for static export
  images: { unoptimized: true },
};

export default nextConfig;
