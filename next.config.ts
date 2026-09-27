import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  "typedRoutes": true,
  "reactStrictMode": true,
  "poweredByHeader": false,
  "experimental": {
    "useLightningcss": false
  }
};

export default nextConfig;
