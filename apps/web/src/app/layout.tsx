import type { Metadata } from 'next'
import { AuthProvider } from '@/components/layout/auth-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sentralyzed',
  description: 'All-in-one project management workspace by Solvre Tech',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
