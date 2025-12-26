import type { NextConfig } from "next";
import { baseURL } from "./baseUrl";
import path from "path";

const nextConfig: NextConfig = {
  assetPrefix: baseURL,
  // Transpile the Mercury SDK from .api folder
  transpilePackages: ["@api/mercurytechnologies"],
  webpack: (config) => {
    // Add the .api folder's node_modules to module resolution
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      path.resolve(__dirname, ".api/apis/mercurytechnologies/node_modules"),
      "node_modules",
    ];
    return config;
  },
};

export default nextConfig;
