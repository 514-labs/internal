import type { NextConfig } from "next";
import { withVercelToolbar } from "@vercel/toolbar/plugins/next";
import { baseURL } from "./baseUrl";

const nextConfig: NextConfig = {
  assetPrefix: baseURL,
};

export default withVercelToolbar()(nextConfig);
