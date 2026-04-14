'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Search, Bell, User, Menu, X,
  ChevronDown, LogOut, Settings, Package, Heart,
  Store, LayoutDashboard, Shield,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useCart } from '@/hooks/useCart';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationDropdown } from './NotificationDropdown';
import { getAvatarUrl, cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/marketplace?gemstone_type=Ruby', label: 'Rubies' },
  { href: '/marketplace?gemstone_type=Sapphire', label: 'Sapphires' },
  { href: '/marketplace?gemstone_type=Emerald', label: 'Emeralds' },
  { href: '/marketplace?is_certified=true', label: 'Certified' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuthStore();
  const { itemCount, openCart } = useCart();
  const { unreadCount } = useNotifications();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleSignOut = async () => {
    setIsUserMenuOpen(false);
    await signOut();
    router.push('/');
  };

  const userMenuItems = [
    ...(user?.role === 'buyer' || user?.role === 'seller'
      ? [
          { label: 'My Orders', href: '/buyer/orders', icon: Package },
          { label: 'Wishlist', href: '/buyer/wishlist', icon: Heart },
          { label: 'Profile', href: '/buyer/profile', icon: User },
        ]
      : []),
    ...(user?.role === 'seller'
      ? [{ label: 'Seller Dashboard', href: '/seller', icon: Store }]
      : []),
    ...(user?.role === 'admin'
      ? [{ label: 'Admin Panel', href: '/admin', icon: Shield }]
      : []),
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-obsidian/95 backdrop-blur-md border-b border-obsidian-border shadow-card'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-gold font-serif text-xl tracking-[0.2em] font-semibold">
              ✦ GEMVAULT
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm transition-colors duration-150',
                  pathname === link.href
                    ? 'text-gold'
                    : 'text-ivory-muted hover:text-ivory'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search + Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ivory-subtle" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search gems…"
                  className="bg-obsidian-light border border-obsidian-border rounded-full pl-9 pr-4 py-2 text-sm text-ivory placeholder:text-ivory-subtle focus:outline-none focus:border-gold/40 w-44 focus:w-56 transition-all duration-300"
                />
              </div>
            </form>

            {/* Cart */}
            <button
              onClick={openCart}
              className="relative p-2 text-ivory-muted hover:text-ivory transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gold text-obsidian text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>

            {/* Notifications */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative p-2 text-ivory-muted hover:text-ivory transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {isNotifOpen && (
                    <NotificationDropdown onClose={() => setIsNotifOpen(false)} />
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-obsidian-light transition-colors"
                >
                  <img
                    src={getAvatarUrl(user?.avatar_url, user?.full_name ?? undefined)}
                    alt={user?.full_name ?? 'User'}
                    className="w-7 h-7 rounded-full object-cover border border-obsidian-border"
                  />
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 text-ivory-muted transition-transform',
                      isUserMenuOpen && 'rotate-180'
                    )}
                  />
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-obsidian-mid border border-obsidian-border rounded-xl shadow-card overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-obsidian-border">
                        <p className="text-sm font-medium text-ivory truncate">
                          {user?.full_name ?? 'Guest'}
                        </p>
                        <p className="text-xs text-ivory-subtle truncate">{user?.email}</p>
                      </div>

                      <div className="py-1">
                        {userMenuItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-ivory-muted hover:text-ivory hover:bg-obsidian-light transition-colors"
                          >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                          </Link>
                        ))}
                      </div>

                      <div className="border-t border-obsidian-border py-1">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-obsidian-light transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login" className="btn-ghost text-sm py-2">
                  Sign In
                </Link>
                <Link href="/register" className="btn-gold text-sm py-2">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="lg:hidden p-2 text-ivory-muted hover:text-ivory transition-colors"
              aria-label="Menu"
            >
              {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden bg-obsidian-mid border-t border-obsidian-border overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {/* Mobile search */}
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-subtle" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search gemstones…"
                    className="input pl-10"
                  />
                </div>
              </form>

              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2.5 rounded-lg text-sm text-ivory-muted hover:text-ivory hover:bg-obsidian-light transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              {!isAuthenticated && (
                <div className="pt-4 border-t border-obsidian-border flex flex-col gap-2">
                  <Link href="/login" className="btn-outline w-full justify-center">
                    Sign In
                  </Link>
                  <Link href="/register" className="btn-gold w-full justify-center">
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
