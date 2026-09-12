import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["linkup-sdk"],
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
