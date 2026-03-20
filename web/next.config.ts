import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["linkedom"],
  experimental: {
    staleTimes: {
      dynamic: 30,
    },
  },
  compiler: {
    removeConsole: {
      exclude: ["error", "warn"],
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
});
