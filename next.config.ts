import type { NextConfig } from "next";

const isWindows = process.platform === "win32";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  serverExternalPackages: ["@supabase/supabase-js", "@supabase/ssr", "@supabase/realtime-js"],
};

// Output tuning
if (!isWindows) {
  (nextConfig as any).output = "standalone";
}

// Webpack customization: safe polyfills + avoid filesystem cache issues on Windows dev
(nextConfig as any).webpack = (config: any) => {
  // Avoid file-based persistent cache on Windows (dev/prod) to prevent ENOENT/EPERM and PackFile warnings
  if (isWindows) {
    config.cache = false;
  }
  // Polyfill buffer for browser-side consumers (e.g., @supabase/storage-js)
  config.resolve = config.resolve || {};
  config.resolve.fallback = {
    ...(config.resolve.fallback || {}),
    buffer: require.resolve("buffer/"),
  };
  return config;
};

// Use an alternate distDir on Windows in development to avoid stale/locked .next
if (isWindows && process.env.NODE_ENV !== "production") {
  (nextConfig as any).distDir = ".next-dev";
}

const withBundleAnalyzer = (() => {
  try {
    // Lazy-load to avoid hard dependency in environments where analyzer is absent.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const bundleAnalyzer = require("@next/bundle-analyzer");
    return bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });
  } catch {
    return (cfg: NextConfig) => cfg;
  }
})();

export default withBundleAnalyzer(nextConfig);
