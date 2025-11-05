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

// Webpack customization: safe polyfills + avoid filesystem cache issues on Windows dev
;(nextConfig as any).webpack = (config: any, { dev }: { dev: boolean }) => {
  // Avoid file-based persistent cache in dev on Windows to prevent ENOENT/EPERM against .next/cache
  if (dev && process.platform === 'win32') {
    config.cache = { type: 'memory' }
  }
  // Polyfill buffer for browser-side consumers (e.g., @supabase/storage-js)
  config.resolve = config.resolve || {}
  config.resolve.fallback = {
    ...(config.resolve.fallback || {}),
    buffer: require.resolve('buffer/')
  }
  return config
}

// Use an alternate distDir on Windows in development to avoid stale/locked .next
if (process.platform === 'win32' && process.env.NODE_ENV !== 'production') {
  ;(nextConfig as any).distDir = '.next-dev'
}
