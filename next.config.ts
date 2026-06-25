import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/api/salon/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "http://localhost:4028" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PATCH,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type,x-salon-id,Authorization" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
        ],
      },
      {
        source: "/api/enquiries",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "http://localhost:4028" },
          { key: "Access-Control-Allow-Methods", value: "POST,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type,x-salon-id" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
        ],
      },
    ];
  },
};

export default nextConfig;
