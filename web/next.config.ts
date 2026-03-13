import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
  // Prevent bundling issues with XML parsing library
  serverExternalPackages: ["linkedom"],
};

export default withSentryConfig(nextConfig, {
  silent: true,
});
