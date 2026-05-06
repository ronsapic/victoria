import type { NextConfig } from "next";

/** Parent-folder lockfiles confuse Turbopack workspace root on some Windows setups. */
const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
