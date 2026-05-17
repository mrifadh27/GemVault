'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Loader2, ExternalLink } from 'lucide-react';
import { cn, getImageUrl } from '@/lib/utils';
import { Avatar } from '@/components/common/Avatar';
import { useAuth } from '@/hooks/useAuth';
import type { GemPostWithDetails } from '@/types';
import { toast } from '@/components/common/Toast';
import Link from 'next/link';

interface DMModalProps {
  post: GemPostWithDetails;
  onClose: () => void;
}

const QUICK_MESSAGES = [
  'Is this still available?',
  'What is your best price?',
  'Can you share more photos?',
  'I am interested, let\'s talk',
  'What are the dimensions?',
];

export function DMModal({ post, onClose }: DMModalProps) {
  const { user, profile } = useAuth();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const seller = post.profiles;
  const primaryImg = post.gem_images.find(i => i.is_primary) ?? post.gem_images[0];

  const sendDM = async (msg: string) => {
    if (!msg.trim() || !user) return;
    setSending(true);
    try {
      const res = await fetch('/api/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: post.id, seller_id: post.seller_id, message: msg.trim() }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Failed to send message');
      }
      const { data } = await res.json();
      setThreadId(data.thread_id || data.id);
      setSent(true);
      toast('Message sent! 💬', 'success');
    } catch (err: unknown) {
      toast((err as Error).message || 'Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e]">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-gold" />
            <span className="font-medium text-sm text-ivory">Message Seller</span>
          </div>
          <button onClick={onClose} className="btn-icon w-7 h-7">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Post preview */}
          <div className="m-4 flex gap-3 p-3 rounded-xl bg-[#0f0f0f] border border-[#1e1e1e]">
            {primaryImg && (
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[#1a1a1a]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getImageUrl(primaryImg.url)} alt={post.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-ivory text-sm line-clamp-1">{post.title}</p>
              <p className="text-xs text-ivory-muted mt-0.5">{post.gemstone_type} · {post.carat_weight ? `${post.carat_weight}ct` : 'N/A'}</p>
              {post.price ? (
                <p className="text-sm font-semibold text-gold mt-1">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: post.currency || 'USD', maximumFractionDigits: 0 }).format(post.price)}
                  {post.is_price_negotiable && <span className="text-xs text-ivory-muted font-normal ml-1">(negotiable)</span>}
                </p>
              ) : (
                <p className="text-sm text-ivory-muted mt-1">Price on request</p>
              )}
            </div>
          </div>

          {/* Seller info */}
          <div className="px-4 flex items-center gap-3 mb-4">
            <Avatar src={seller.avatar_url} username={seller.username} size="md" />
            <div>
              <p className="font-medium text-sm text-ivory">@{seller.username}</p>
              {seller.location && <p className="text-xs text-ivory-muted">📍 {seller.location}</p>}
            </div>
          </div>

          {sent ? (
            /* Success state */
            <div className="px-4 pb-6 text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-semibold text-ivory mb-1">Message Sent!</p>
              <p className="text-sm text-ivory-muted mb-4">@{seller.username} will reply shortly.</p>
              {threadId && (
                <Link href={`/messages?thread=${threadId}`} className="btn-gold px-6 py-2.5 rounded-full" onClick={onClose}>
                  Open Conversation
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}

              {/* Contact links */}
              {(seller.whatsapp_number || seller.instagram_handle || seller.telegram_handle) && (
                <div className="mt-5 pt-4 border-t border-[#1e1e1e]">
                  <p className="text-xs text-ivory-muted mb-3">Or reach them directly:</p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    {seller.whatsapp_number && (
                      <a
                        href={`https://wa.me/${seller.whatsapp_number.replace(/\D/g, '')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-full bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/20 transition-colors"
                      >
                        <span>📱</span> WhatsApp
                      </a>
                    )}
                    {seller.instagram_handle && (
                      <a
                        href={`https://instagram.com/${seller.instagram_handle.replace('@', '')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-full bg-[#E1306C]/10 text-[#E1306C] border border-[#E1306C]/30 hover:bg-[#E1306C]/20 transition-colors"
                      >
                        <span>📸</span> Instagram
                      </a>
                    )}
                    {seller.telegram_handle && (
                      <a
                        href={`https://t.me/${seller.telegram_handle.replace('@', '')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-full bg-[#0088CC]/10 text-[#0088CC] border border-[#0088CC]/30 hover:bg-[#0088CC]/20 transition-colors"
                      >
                        <span>✈️</span> Telegram
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : !user ? (
            /* Not logged in */
            <div className="px-4 pb-6 text-center">
              <p className="text-ivory-muted text-sm mb-4">Sign in to message the seller</p>
              <Link href="/auth" className="btn-gold px-6 py-2.5 rounded-full" onClick={onClose}>
                Sign In
              </Link>
            </div>
          ) : (
            /* Message input */
            <div className="px-4 pb-4">
              {/* Quick replies */}
              <div className="flex flex-wrap gap-2 mb-3">
                {QUICK_MESSAGES.map(q => (
                  <button
                    key={q}
                    onClick={() => setMessage(q)}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-full border transition-all',
                      message === q
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-[#2a2a2a] text-ivory-muted hover:border-[#444] hover:text-ivory'
                    )}
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Write your message..."
                rows={3}
                className="input resize-none mb-3"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendDM(message);
                  }
                }}
              />

              <button
                onClick={() => sendDM(message)}
                disabled={!message.trim() || sending}
                className="btn-gold w-full justify-center rounded-xl py-3"
              >
                {sending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="w-4 h-4" /> Need DM — Send Message</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
