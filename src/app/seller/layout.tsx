'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingBag, DollarSign,
  Settings, ChevronRight, Store, TrendingUp
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/seller', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/seller/listings', label: 'Listings', icon: Package },
  { href: '/seller/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/seller/payouts', label: 'Payouts', icon: DollarSign },
  { href: '/seller/settings', label: 'Settings', icon: Settings },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, sellerProfile } = useAuthStore();

  return (
    <div className="min-h-screen flex pt-16">
      {/* Sidebar */}
      <aside className="w-60 bg-obsidian-mid border-r border-obsidian-border flex-shrink-0 hidden md:flex flex-col">
        {/* Store header */}
        <div className="p-5 border-b border-obsidian-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0">
              <Store className="w-4 h-4 text-gold" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ivory truncate">
                {sellerProfile?.store_name ?? 'My Store'}
              </p>
              <p className="text-xs text-ivory-subtle capitalize">
                {sellerProfile?.verification_status ?? 'pending'}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
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
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-obsidian-border">
          <Link href="/marketplace" className="btn-ghost w-full text-xs justify-center">
            ← Back to Marketplace
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
