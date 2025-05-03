// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["better-auth"]
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL
  }
}

module.exports = nextConfig
