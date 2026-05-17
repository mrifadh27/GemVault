'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusSquare, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export function BottomNav() {
  const pathname = usePathname();
  const { user, profile } = useAuth();

  const items = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/explore', icon: Search, label: 'Explore' },
    { href: '/create', icon: PlusSquare, label: 'Post' },
    { href: '/messages', icon: MessageCircle, label: 'DMs' },
    { href: user ? `/profile/${profile?.username || user.id}` : '/auth', icon: User, label: user ? 'Profile' : 'Sign In' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-obsidian/95 backdrop-blur-md border-t border-[#1a1a1a] sm:hidden">
      <div className="flex items-center justify-around h-14 px-2">
        {items.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className="bottom-nav-item">
              <Icon
                className={cn('w-6 h-6 transition-colors', active ? 'text-gold' : 'text-ivory-subtle')}
                strokeWidth={active ? 2 : 1.5}
              />
              <span className={cn('transition-colors', active ? 'text-gold' : 'text-[#555]')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
