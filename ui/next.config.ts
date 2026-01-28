import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
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
