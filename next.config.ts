import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App Router lives in `src/app` only. Do not add a root `app/` directory or symlink:
  // Next prioritizes `./app` over `./src/app`, and a symlink can make `GET /` return 404 in dev (Turbopack).
};

export default nextConfig;
