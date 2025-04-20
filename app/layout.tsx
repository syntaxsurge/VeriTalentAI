import './globals.css'
import { Manrope } from 'next/font/google'

import type { Metadata, Viewport } from 'next'

import SiteHeader from '@/components/site-header'
import { ThemeProvider } from '@/components/theme-provider'
import { UserProvider } from '@/lib/auth'
import { getUser } from '@/lib/db/queries'

export const metadata: Metadata = {
  title: 'Viskify',
  description: 'AI-Assisted, Credential-Backed Hiring.',
  icons: {
    icon: 'images/favicon.ico',
  },
}

export const viewport: Viewport = {
  maximumScale: 1,
}

const manrope = Manrope({ subsets: ['latin'] })

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Pre‑fetch user data; passed through <UserProvider>
  const userPromise = getUser()

  return (
    <html
      lang='en'
      className={`bg-background text-foreground ${manrope.className}`}
      suppressHydrationWarning
    >
      <body className='min-h-[100dvh]'>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <UserProvider userPromise={userPromise}>
            {/* Global header */}
            <SiteHeader />

            {/* Main page content with top‑padding for the sticky header */}
            <main className='mx-auto max-w-7xl px-4 py-6 md:px-6'>{children}</main>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
