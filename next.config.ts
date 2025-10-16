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
  // 關閉開發環境的錯誤覆蓋層（Error Overlay）中的某些警告
  reactStrictMode: false, // 暫時關閉嚴格模式以避免誤報
};

export default nextConfig;
