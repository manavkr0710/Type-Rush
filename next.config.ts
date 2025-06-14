import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // This is only for deployment to Heroku and should be fixed in production.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Similarly for ESLint errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
