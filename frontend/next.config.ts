import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://192.168.50.146:3001", "http://localhost:3001", "http://localhost:3000", "http://127.0.0.1:3001"],
};

export default nextConfig;
