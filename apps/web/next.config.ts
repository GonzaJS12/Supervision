import path from "node:path";
import { existsSync } from "node:fs";
import os from "node:os";
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

function origenesLan() {
  const extras = (process.env.ALLOWED_DEV_ORIGINS ?? "")
    .split(",")
    .map((origen) => origen.trim())
    .filter(Boolean);

  const ips = Object.values(os.networkInterfaces())
    .flat()
    .filter((item): item is os.NetworkInterfaceInfo => {
      if (!item) {
        return false;
      }
      return (
        !item.internal &&
        (item.family === "IPv4" ||
          (item.family as unknown as number) === 4)
      );
    })
    .map((item) => item.address);

  return [
    "localhost",
    "127.0.0.1",
    "10.0.2.2",
    "26.40.7.116",
    "172.16.9.195",
    ...ips,
    ...extras,
  ];
}

const nextConfig: NextConfig = {
  transpilePackages: [
    "@supervision/domain",
    "@supervision/database",
    "@supervision/api-client",
  ],
  allowedDevOrigins: origenesLan(),
  async rewrites() {
    return [
      {
        source: "/api/v1/bloques-evaluacion",
        destination: "/api/v1/bloques",
      },
      {
        source: "/api/v1/bloques-evaluacion/:path*",
        destination: "/api/v1/bloques/:path*",
      },
      {
        source: "/api/v1/criterios-evaluacion",
        destination: "/api/v1/criterios",
      },
      {
        source: "/api/v1/criterios-evaluacion/:path*",
        destination: "/api/v1/criterios/:path*",
      },
    ];
  },
};

export default nextConfig;
