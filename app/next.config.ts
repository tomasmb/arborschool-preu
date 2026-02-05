import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
  // Prevent bundling issues with XML parsing library
  serverExternalPackages: ["linkedom"],
};

export default withSentryConfig(nextConfig, {
  // Suppresses source map uploading logs during build
  silent: true,

  // Automatically instrument server functions and app directory
  autoInstrumentServerFunctions: true,
  autoInstrumentMiddleware: true,
  autoInstrumentAppDirectory: true,
});
