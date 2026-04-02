import type { Metadata } from 'next'
import { AuthProvider } from '@/components/layout/auth-provider'
import { ThemeProvider } from '@/components/layout/theme-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sentralyzed',
  description: 'All-in-one project management workspace by Solvre Tech',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
