'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Heart, User, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/buyer/orders', label: 'My Orders', icon: Package },
  { href: '/buyer/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/buyer/profile', label: 'Profile', icon: User },
];

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex pt-16">
      <aside className="w-56 bg-obsidian-mid border-r border-obsidian-border flex-shrink-0 hidden md:flex flex-col">
        <div className="p-5 border-b border-obsidian-border">
          <p className="text-xs text-ivory-subtle uppercase tracking-widest mb-0.5">My Account</p>
          <p className="text-sm font-medium text-ivory">Buyer Dashboard</p>
        </div>
        <nav className="flex-1 p-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5',
                  isActive
                    ? 'bg-gold/15 text-gold border border-gold/20'
                    : 'text-ivory-muted hover:text-ivory hover:bg-obsidian-light'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-obsidian-border">
          <Link href="/marketplace" className="btn-ghost w-full text-xs justify-center">
            ← Marketplace
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
