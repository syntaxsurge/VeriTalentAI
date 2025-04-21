import './globals.css'
import { Manrope } from 'next/font/google'

import type { Metadata, Viewport } from 'next'

import SiteHeader from '@/components/site-header'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { UserProvider } from '@/lib/auth'
import { getUser } from '@/lib/db/queries'

export const metadata: Metadata = {
  title: 'Viskify',
  description: 'AI-Assisted, Credential-Backed Hiring.',
  icons: { icon: 'images/favicon.ico' },
}

export const viewport: Viewport = { maximumScale: 1 }

const manrope = Manrope({ subsets: ['latin'] })

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const userPromise = getUser()

  return (
    <html
      lang="en"
      className={`bg-background text-foreground ${manrope.className}`}
      suppressHydrationWarning
    >
      <body className="min-h-[100dvh]">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Global toast provider with custom aesthetic */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              classNames: {
                toast:
                  'pointer-events-auto relative flex w-[360px] items-start overflow-hidden rounded-lg border bg-white/90 dark:bg-zinc-900/90 shadow-lg ring-1 ring-border/50 backdrop-blur-md',
                title: 'font-semibold text-foreground',
                description: 'text-sm text-muted-foreground',
                actionButton:
                  'inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90',
                cancelButton:
                  'inline-flex h-8 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-muted',
                closeButton:
                  'p-1 ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              },
            }}
          />

          <UserProvider userPromise={userPromise}>
            {/* Global header */}
            <SiteHeader />

            {/* Main content */}
            <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">{children}</main>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}