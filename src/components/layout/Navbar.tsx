'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, MessageCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/common/Avatar';
import { useAuth } from '@/hooks/useAuth';

export function Navbar() {
  const { user, profile } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-obsidian/95 backdrop-blur-md border-b border-[#1a1a1a]">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <Image
            src="/gemgram-logo.png"
            alt="GemGram"
            width={220}
            height={70}
            className="h-24 w-auto object-contain scale-200"
            priority
          />
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Link href="/explore" className={cn('btn-icon', pathname === '/explore' && 'text-gold')}>
            <Search className="w-5 h-5" />
          </Link>

          {user ? (
            <>
              <Link href="/messages" className={cn('btn-icon relative', pathname === '/messages' && 'text-gold')}>
                <MessageCircle className="w-5 h-5" />
              </Link>

              <Link
                href="/create"
                className="btn-gold ml-1 px-3 py-1.5 text-xs rounded-full gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Post
              </Link>

              <Link href={`/profile/${profile?.username || user.id}`} className="ml-1">
                <Avatar
                  src={profile?.avatar_url}
                  username={profile?.username}
                  size="sm"
                  ring={pathname.startsWith('/profile')}
                />
              </Link>
            </>
          ) : (
            <Link href="/auth" className="btn-gold px-4 py-1.5 text-xs rounded-full">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}