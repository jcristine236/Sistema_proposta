import type { NextConfig } from "next";

const config: NextConfig = {
  // Gera um servidor enxuto em .next/standalone (usado no Dockerfile).
  output: "standalone",
  poweredByHeader: false,
};

export default config;
