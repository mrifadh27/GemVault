'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShieldCheck, AlertCircle, X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useUIStore } from '@/stores/ui.store';
import { getGemstoneColor, formatPrice, calculateDiscountPercent, cn } from '@/lib/utils';
import type { GemstoneType } from '@/types';

// ============================================================
// GemBadge
// ============================================================
interface GemBadgeProps {
  type: GemstoneType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function GemBadge({ type, size = 'md', className }: GemBadgeProps) {
  const color = getGemstoneColor(type);
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={cn('badge font-medium rounded-full', sizeClasses[size], className)}
      style={{
        color,
        backgroundColor: `${color}18`,
        borderColor: `${color}30`,
        borderWidth: 1,
        borderStyle: 'solid',
      }}
    >
      {type}
    </span>
  );
}

// ============================================================
// StarRating
// ============================================================
interface StarRatingProps {
  rating: number;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  count,
  size = 'md',
  interactive = false,
  onChange,
}: StarRatingProps) {
  const starSizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' };
  const textSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              starSizes[size],
              star <= Math.round(rating)
                ? 'fill-gold text-gold'
                : 'fill-transparent text-obsidian-border',
              interactive && 'cursor-pointer hover:text-gold/80 transition-colors'
            )}
            onClick={() => interactive && onChange?.(star)}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className={cn('text-ivory-subtle', textSizes[size])}>
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
}

// ============================================================
// PriceDisplay
// ============================================================
interface PriceDisplayProps {
  price: number;
  comparePrice?: number | null;
  currency?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function PriceDisplay({
  price,
  comparePrice,
  currency = 'USD',
  size = 'md',
  className,
}: PriceDisplayProps) {
  const priceSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };
  const compareSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base', xl: 'text-lg' };
  const discount = comparePrice ? calculateDiscountPercent(price, comparePrice) : 0;

  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <span className={cn('font-serif font-semibold text-gold', priceSizes[size])}>
        {formatPrice(price, currency)}
      </span>
      {comparePrice && comparePrice > price && (
        <>
          <span className={cn('text-ivory-subtle line-through', compareSizes[size])}>
            {formatPrice(comparePrice, currency)}
          </span>
          {discount > 0 && (
            <span className="badge-red text-[10px] px-1.5 py-0">
              -{discount}%
            </span>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// LowStockBadge
// ============================================================
interface LowStockBadgeProps {
  quantity: number;
  threshold?: number;
}

export function LowStockBadge({ quantity, threshold = 3 }: LowStockBadgeProps) {
  if (quantity === 0) {
    return (
      <span className="badge bg-red-500/20 text-red-400 border border-red-500/30">
        Out of Stock
      </span>
    );
  }

  if (quantity <= threshold) {
    return (
      <span className="badge bg-orange-500/15 text-orange-400 border border-orange-500/25 animate-pulse-gold">
        Only {quantity} left
      </span>
    );
  }

  return null;
}

// ============================================================
// VerifiedBadge
// ============================================================
interface VerifiedBadgeProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function VerifiedBadge({ label = 'Verified', size = 'md' }: VerifiedBadgeProps) {
  const sizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' };
  const textSizes = { sm: 'text-xs', md: 'text-xs', lg: 'text-sm' };

  return (
    <span className={cn('badge bg-green-400/10 text-green-400 border border-green-400/20', textSizes[size])}>
      <ShieldCheck className={cn(sizes[size])} />
      {label}
    </span>
  );
}

// ============================================================
// LoadingSpinner
// ============================================================
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };

  return (
    <div
      className={cn(
        sizes[size],
        'rounded-full border-2 border-obsidian-border border-t-gold animate-spin',
        className
      )}
    />
  );
}

// ============================================================
// EmptyState
// ============================================================
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-4">
      {icon && (
        <div className="w-16 h-16 rounded-full bg-obsidian-light flex items-center justify-center text-ivory-subtle">
          {icon}
        </div>
      )}
      <div>
        <h3 className="font-serif text-2xl text-ivory mb-2">{title}</h3>
        {description && <p className="text-sm text-ivory-muted max-w-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// ============================================================
// Toast + ToastContainer
// ============================================================
const TOAST_ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  default: Info,
};

const TOAST_STYLES = {
  success: 'border-green-500/30 bg-green-500/10',
  error: 'border-red-500/30 bg-red-500/10',
  warning: 'border-yellow-500/30 bg-yellow-500/10',
  default: 'border-obsidian-border bg-obsidian-mid',
};

const TOAST_ICON_STYLES = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
  default: 'text-ivory-muted',
};

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const Icon = TOAST_ICONS[toast.variant];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                'flex items-start gap-3 px-4 py-3.5 rounded-xl border shadow-card min-w-[280px]',
                TOAST_STYLES[toast.variant]
              )}
            >
              <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', TOAST_ICON_STYLES[toast.variant])} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ivory">{toast.title}</p>
                {toast.description && (
                  <p className="text-xs text-ivory-muted mt-0.5">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-ivory-subtle hover:text-ivory transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
