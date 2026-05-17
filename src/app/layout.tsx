import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/providers/Providers';

export const metadata: Metadata = {
  title: { default: 'GemGram', template: '%s · GemGram' },
  description: 'The Instagram for gem lovers. Buy & sell rare gemstones via DM.',
  keywords: ['gemstones', 'ruby', 'sapphire', 'emerald', 'gems', 'gemology'],
  openGraph: {
    title: 'GemGram',
    description: 'The Instagram for gem lovers.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#080808',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-obsidian text-ivory font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
