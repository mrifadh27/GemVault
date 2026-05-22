'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusSquare, MessageCircle, User, BarChart2, BookOpen, Map, Users, Gem } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export function BottomNav() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const [showMore, setShowMore] = useState(false);

  const mainItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/explore', icon: Search, label: 'Explore' },
    { href: '/create', icon: PlusSquare, label: 'Post' },
    { href: '/messages', icon: MessageCircle, label: 'DMs' },
    { href: user ? `/profile/${profile?.username || user.id}` : '/auth', icon: User, label: user ? 'Me' : 'Sign In' },
  ];

  const moreItems = [
    { href: '/analytics', icon: BarChart2, label: 'Analytics' },
    { href: '/map', icon: Map, label: 'Origin Map' },
    { href: '/knowledge', icon: BookOpen, label: 'Learn' },
    { href: '/groups', icon: Users, label: 'Groups' },
    { href: '/collection', icon: Gem, label: 'Collection' },
  ];

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)}>
          <div
            className="absolute bottom-14 left-0 right-0 bg-[#0f0f0f]/95 backdrop-blur-md border-t border-[#1a1a1a] grid grid-cols-5"
            onClick={e => e.stopPropagation()}
          >
            {moreItems.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setShowMore(false)}
                  className="flex flex-col items-center justify-center gap-1 py-3 px-1"
                >
                  <Icon className={cn('w-5 h-5 transition-colors', active ? 'text-gold' : 'text-ivory-subtle')} strokeWidth={active ? 2 : 1.5} />
                  <span className={cn('text-[9px] transition-colors', active ? 'text-gold' : 'text-[#555]')}>{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-obsidian/95 backdrop-blur-md border-t border-[#1a1a1a] sm:hidden">
        <div className="flex items-center justify-around h-14 px-1">
          {mainItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} className="bottom-nav-item">
                <Icon className={cn('w-6 h-6 transition-colors', active ? 'text-gold' : 'text-ivory-subtle')} strokeWidth={active ? 2 : 1.5} />
                <span className={cn('transition-colors', active ? 'text-gold' : 'text-[#555]')}>{label}</span>
              </Link>
            );
          })}
          {/* More button — opens the secondary row */}
          <button
            onClick={() => setShowMore(v => !v)}
            className="bottom-nav-item"
          >
            <div className={cn('w-6 h-6 flex flex-col items-center justify-center gap-[3px] transition-colors', showMore ? 'text-gold' : 'text-ivory-subtle')}>
              <span className="w-4 h-[1.5px] bg-current rounded" />
              <span className="w-4 h-[1.5px] bg-current rounded" />
              <span className="w-4 h-[1.5px] bg-current rounded" />
            </div>
            <span className={cn('transition-colors', showMore ? 'text-gold' : 'text-[#555]')}>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
