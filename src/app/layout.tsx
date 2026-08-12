import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Solo Leveling System',
  description: 'نظام إدارة المهام الواقعي الذكي',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
      </body>
    </html>
  )
}