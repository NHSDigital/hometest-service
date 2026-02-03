import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/get-self-test-kit-for-HIV",
        permanent: true,
      },
    ];
  }
};

export default nextConfig;
