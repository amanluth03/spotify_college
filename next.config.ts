import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // The parent directory (~) also has a lockfile; pin the root to this project
  // so Turbopack and output file tracing resolve correctly.
  turbopack: {
    root: path.resolve(__dirname),
  },
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
