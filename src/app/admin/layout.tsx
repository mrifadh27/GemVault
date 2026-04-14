'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Package, Store, ShoppingBag, Settings, Shield, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/sellers', label: 'Sellers', icon: Store },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex pt-16">
      <aside className="w-60 bg-obsidian-mid border-r border-obsidian-border flex-shrink-0 hidden md:flex flex-col">
        <div className="p-5 border-b border-obsidian-border">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-gold" />
            <div>
              <p className="text-sm font-semibold text-ivory">Admin Panel</p>
              <p className="text-xs text-ivory-subtle">GemVault Management</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
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
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
