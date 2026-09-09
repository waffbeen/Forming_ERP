import type { Metadata } from 'next'
import './globals.css'
import {
  GlobalAlertProvider, LanguageProvider, PageTitleProvider, SearchPreferencesProvider,
} from 'indas-ui/providers'
import { ThemeProvider, ThemeScript } from '@/components/providers/theme-provider'

export const metadata: Metadata = {
  title: 'Indus Forming ERP',
  description: 'Thermoforming ERP — sales orders, job cards, quality and dispatch',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body suppressHydrationWarning>
        {/* indas-ui's DataGrid and modals read these contexts. Colour still
            comes from this app's own ThemeProvider, not the library's. */}
        <GlobalAlertProvider>
          <SearchPreferencesProvider>
            <PageTitleProvider>
              <LanguageProvider>
                <ThemeProvider>{children}</ThemeProvider>
              </LanguageProvider>
            </PageTitleProvider>
          </SearchPreferencesProvider>
        </GlobalAlertProvider>
      </body>
    </html>
  )
}
