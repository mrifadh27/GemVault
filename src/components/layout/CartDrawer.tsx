'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, ShoppingBag, Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { formatPrice, getProductImageUrl, truncate } from '@/lib/utils';

export function CartDrawer() {
  const {
    items,
    isOpen,
    isLoading,
    subtotal,
    itemCount,
    closeCart,
    removeFromCart,
    updateQuantity,
  } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-obsidian-mid border-l border-obsidian-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-obsidian-border">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-gold" />
                <h2 className="font-serif text-xl text-ivory">
                  Your Cart
                  {itemCount > 0 && (
                    <span className="ml-2 text-sm font-sans text-ivory-muted">
                      ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                    </span>
                  )}
                </h2>
              </div>
              <button
                onClick={closeCart}
                className="p-2 text-ivory-muted hover:text-ivory hover:bg-obsidian-light rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto py-4">
              {isLoading ? (
                <div className="space-y-4 px-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="w-20 h-20 rounded-lg skeleton" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3 skeleton rounded w-3/4" />
                        <div className="h-3 skeleton rounded w-1/2" />
                        <div className="h-3 skeleton rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
                  <div className="w-20 h-20 rounded-full bg-obsidian-light flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-ivory-subtle" />
                  </div>
                  <div className="text-center">
                    <p className="text-ivory font-serif text-xl mb-1">Your cart is empty</p>
                    <p className="text-sm text-ivory-muted">
                      Discover exceptional gemstones from verified sellers
                    </p>
                  </div>
                  <Link href="/marketplace" onClick={closeCart} className="btn-gold mt-2">
                    Browse Marketplace
                  </Link>
                </div>
              ) : (
                <div className="space-y-1 px-6">
                  {items.map((item) => {
                    const product = item.products;
                    if (!product) return null;
                    const primaryImage = product.product_images?.find(
                      (img) => img.is_primary
                    ) ?? product.product_images?.[0];

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex gap-4 py-4 border-b border-obsidian-border/50 last:border-0"
                      >
                        {/* Image */}
                        <Link
                          href={`/marketplace/${product.slug}`}
                          onClick={closeCart}
                          className="flex-shrink-0"
                        >
                          <img
                            src={getProductImageUrl(primaryImage?.url)}
                            alt={product.name}
                            className="w-20 h-20 rounded-lg object-cover border border-obsidian-border"
                          />
                        </Link>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/marketplace/${product.slug}`}
                            onClick={closeCart}
                            className="block text-sm font-medium text-ivory hover:text-gold transition-colors truncate"
                          >
                            {product.name}
                          </Link>
                          <p className="text-xs text-ivory-muted mt-0.5">
                            {product.carat_weight}ct {product.gemstone_type}
                          </p>
                          <p className="text-sm font-semibold text-gold mt-1">
                            {formatPrice(product.price)}
                          </p>

                          {/* Quantity controls */}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() =>
                                updateQuantity(product.id, item.quantity - 1)
                              }
                              className="w-6 h-6 rounded border border-obsidian-border flex items-center justify-center text-ivory-muted hover:text-ivory hover:border-gold/40 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm text-ivory w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(product.id, item.quantity + 1)
                              }
                              disabled={item.quantity >= product.stock_quantity}
                              className="w-6 h-6 rounded border border-obsidian-border flex items-center justify-center text-ivory-muted hover:text-ivory hover:border-gold/40 transition-colors disabled:opacity-30"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => removeFromCart(product.id)}
                              className="ml-auto p-1 text-ivory-subtle hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-obsidian-border px-6 py-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ivory-muted">Subtotal</span>
                  <span className="font-serif text-xl text-gold">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <p className="text-xs text-ivory-subtle text-center">
                  Shipping and taxes calculated at checkout
                </p>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="btn-gold w-full justify-center"
                >
                  Proceed to Checkout
                </Link>
                <button
                  onClick={closeCart}
                  className="btn-ghost w-full justify-center text-sm"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
