import type { NextConfig } from "next";

const nextConfig: NextConfig = { 
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined, 
  transpilePackages: ["three"], 
};

export default nextConfig;
