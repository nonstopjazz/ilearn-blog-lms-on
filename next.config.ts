import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // 在生產環境建置時忽略 ESLint 錯誤
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 在生產環境建置時忽略 TypeScript 錯誤
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
