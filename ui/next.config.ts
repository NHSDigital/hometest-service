import type { NextConfig } from "next";

const shouldExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  distDir: "build",
  ...(shouldExport ? { output: "export" } : {}),
};

export default nextConfig;
