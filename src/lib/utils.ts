import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffWeeks < 4) return `${diffWeeks}w`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

export function getImageUrl(url: string | null | undefined): string {
  if (!url) return PLACEHOLDER_IMAGE;
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${url}`;
}

export function getAvatarUrl(url: string | null | undefined, username?: string): string {
  if (url) return getImageUrl(url);
  const name = username || 'GG';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a1a&color=c4a25d&size=128&bold=true&rounded=true`;
}

export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzBmMGYwZiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj7wn4y4PC90ZXh0Pjwvc3ZnPg==';

export const gemstoneColors: Record<string, string> = {
  Ruby: '#EF4444', Sapphire: '#3B82F6', Emerald: '#10B981',
  Diamond: '#94A3B8', Amethyst: '#8B5CF6', Opal: '#F97316',
  Topaz: '#EAB308', Aquamarine: '#06B6D4', Garnet: '#DC2626',
  Tourmaline: '#A855F7', Tanzanite: '#7C3AED', Spinel: '#EC4899',
  Alexandrite: '#059669', Morganite: '#F472B6', Peridot: '#84CC16',
  Citrine: '#F59E0B', Zircon: '#38BDF8', Other: '#6B7280',
};

export function getGemstoneColor(type: string): string {
  return gemstoneColors[type] ?? '#C4A25D';
}

export function buildQueryString(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  });
  return sp.toString();
}

export function generateUsername(email: string): string {
  const base = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const suffix = Math.floor(Math.random() * 9999);
  return `${base}${suffix}`;
}
