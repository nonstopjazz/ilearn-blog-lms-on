import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
// 🔧 移除：不再需要 AuthProvider
// import { AuthProvider } from '@/lib/auth-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '學習平台',
  description: '現代化線上課程學習平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        {/* 🔧 移除：不再需要 AuthProvider 包裝 */}
        {children}
      </body>
    </html>
  )
}