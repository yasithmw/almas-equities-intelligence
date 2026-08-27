import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Almas Equities, demonstration environment',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* The --font-sans / --font-mono stacks ported from the platform name
            Inter and JetBrains Mono as the fallbacks after the Apple system
            faces, so a client opening the link on Windows lands on the same
            shapes rather than on Segoe. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
