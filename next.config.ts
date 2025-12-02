import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/avalon",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
