import type { Metadata } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import './globals.css'
import { getSession } from '@/lib/auth'
import LogoutButton from './LogoutButton'

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-be-vietnam',
})

export const metadata: Metadata = {
  title: 'Quản Lý Dữ Liệu',
  description: 'Hệ thống quản lý dữ liệu linh hoạt',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  return (
    <html lang="vi" className={beVietnamPro.variable}>
      <body className={`min-h-screen bg-gray-50 ${beVietnamPro.className}`}>
        {session && (
          <div className="bg-white border-b border-gray-100 px-6 py-2 flex items-center justify-end gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-700 font-semibold text-xs">
                  {session.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="font-medium">{session.username}</span>
            </div>
            <LogoutButton />
          </div>
        )}
        {children}
      </body>
    </html>
  )
}
