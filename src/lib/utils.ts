import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================================
// TAILWIND UTILITY
// ============================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// PRICE FORMATTING
// ============================================================

export function formatPrice(
  amount: number,
  currency = 'USD',
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}

export function formatPriceCompact(amount: number, currency = 'USD'): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return formatPrice(amount, currency);
}

export function calculateDiscountPercent(
  price: number,
  comparePrice: number
): number {
  if (comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

// ============================================================
// DATE FORMATTING
// ============================================================

export function formatDate(
  dateString: string | Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  }).format(date);
}

export function formatDateTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return formatDate(dateString);
}

// ============================================================
// SLUG GENERATION
// ============================================================

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateProductSlug(name: string, id: string): string {
  const base = generateSlug(name);
  const suffix = id.slice(0, 8);
  return `${base}-${suffix}`;
}

// ============================================================
// TEXT UTILITIES
// ============================================================

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  const pluralForm = plural ?? `${singular}s`;
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function titleCase(text: string): string {
  return text
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');
}

// ============================================================
// CARAT FORMATTING
// ============================================================

export function formatCarat(carat: number): string {
  if (carat < 1) {
    return `${(carat * 100).toFixed(0)}pt`;
  }
  return `${carat.toFixed(2)}ct`;
}

// ============================================================
// GEMSTONE COLOR MAP
// ============================================================

export const gemstoneColors: Record<string, string> = {
  Ruby: '#E53E3E',
  Sapphire: '#3182CE',
  Emerald: '#38A169',
  Diamond: '#E2E8F0',
  Amethyst: '#805AD5',
  Opal: '#ED8936',
  Topaz: '#ECC94B',
  Aquamarine: '#76E4F7',
  Garnet: '#C53030',
  Tourmaline: '#2D3748',
  Tanzanite: '#553C9A',
  Spinel: '#D53F8C',
  Other: '#718096',
};

export function getGemstoneColor(type: string): string {
  return gemstoneColors[type] ?? '#718096';
}

// ============================================================
// ORDER STATUS UTILITIES
// ============================================================

export const orderStatusLabels: Record<string, string> = {
  pending_payment: 'Awaiting Payment',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export const orderStatusColors: Record<string, string> = {
  pending_payment: 'text-yellow-400 bg-yellow-400/10',
  confirmed: 'text-blue-400 bg-blue-400/10',
  processing: 'text-purple-400 bg-purple-400/10',
  shipped: 'text-cyan-400 bg-cyan-400/10',
  delivered: 'text-green-400 bg-green-400/10',
  cancelled: 'text-red-400 bg-red-400/10',
  refunded: 'text-gray-400 bg-gray-400/10',
};

// ============================================================
// NUMBER UTILITIES
// ============================================================

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

// ============================================================
// IMAGE UTILITIES
// ============================================================

export function getProductImageUrl(url: string | null | undefined): string {
  if (!url) return '/images/gemstone-placeholder.jpg';
  if (url.startsWith('http')) return url;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${url}`;
}

export function getAvatarUrl(url: string | null | undefined, name?: string): string {
  if (url) return url;
  if (name) {
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=c9a96e&color=0a0a0f&size=128`;
  }
  return '/images/avatar-placeholder.jpg';
}

// ============================================================
// ARRAY UTILITIES
// ============================================================

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const group = String(item[key]);
      return {
        ...groups,
        [group]: [...(groups[group] ?? []), item],
      };
    },
    {} as Record<string, T[]>
  );
}

export function sortBy<T>(
  array: T[],
  key: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// API HELPERS
// ============================================================

export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  return searchParams.toString();
}

export async function handleApiError(response: Response): Promise<never> {
  let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  try {
    const body = await response.json();
    errorMessage = body.error ?? body.message ?? errorMessage;
  } catch {
    // Use default message
  }
  throw new Error(errorMessage);
}
