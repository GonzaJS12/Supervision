import path from "node:path";
import { existsSync } from "node:fs";
import { config } from "dotenv";
import type { NextConfig } from "next";

const envRaiz = path.resolve(process.cwd(), "../../.env");
const envLocal = path.resolve(process.cwd(), ".env");

if (existsSync(envRaiz)) {
  config({ path: envRaiz });
}

if (existsSync(envLocal)) {
  config({ path: envLocal, override: true });
}

const nextConfig: NextConfig = {
  transpilePackages: [
    "@supervision/domain",
    "@supervision/database",
    "@supervision/api-client",
  ],
  allowedDevOrigins: (
    process.env.ALLOWED_DEV_ORIGINS ??
    "26.40.7.116,172.16.9.195"
  )
    .split(",")
    .map((origen) => origen.trim())
    .filter(Boolean),
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,POST,PATCH,OPTIONS",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
