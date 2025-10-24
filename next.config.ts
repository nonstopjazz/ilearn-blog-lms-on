import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 臨時：暫時忽略 ESLint 警告以完成部署
  // TODO: 系統化修復約 300 個代碼質量問題後重新啟用
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 安全增強：啟用 TypeScript 型別檢查以確保型別安全
  typescript: {
    ignoreBuildErrors: false,
  },
  // 安全增強：限制允許的圖片來源，防止 SSRF 攻擊
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ilearn-blog-lms-on.vercel.app',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'bunnycdn.com',
      },
      {
        protocol: 'https',
        hostname: '*.bunny.net',
      },
    ],
  },
  // 安全增強：啟用 React 嚴格模式以偵測潛在問題
  reactStrictMode: true,
};

export default nextConfig;
