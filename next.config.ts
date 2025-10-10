import type { NextConfig } from "next";

const isWindows = process.platform === 'win32';

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {},

};

if (!isWindows) {
  (nextConfig as any).output = 'standalone';
}

export default nextConfig;
