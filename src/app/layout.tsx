import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { ToastContainer } from '@/components/common/Toast';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'GemVault — Premium Gemstone Marketplace',
    template: '%s | GemVault',
  },
  description:
    'Discover certified gemstones from verified sellers worldwide. Rubies, sapphires, emeralds, diamonds, and more.',
  keywords: ['gemstones', 'precious stones', 'certified gems', 'ruby', 'sapphire', 'emerald', 'diamond', 'marketplace'],
  authors: [{ name: 'GemVault' }],
  creator: 'GemVault',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'GemVault',
    title: 'GemVault — Premium Gemstone Marketplace',
    description: 'Discover certified gemstones from verified sellers worldwide.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'GemVault' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GemVault — Premium Gemstone Marketplace',
    description: 'Discover certified gemstones from verified sellers worldwide.',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0f',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body className="bg-obsidian text-ivory font-sans antialiased">
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <CartDrawer />
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
