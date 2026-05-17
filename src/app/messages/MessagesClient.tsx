'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, ArrowLeft, Loader2, MessageCircle } from 'lucide-react';
import { cn, formatRelativeDate, getImageUrl } from '@/lib/utils';
import { Avatar } from '@/components/common/Avatar';
import { useAuth } from '@/hooks/useAuth';
import type { DmThread, DmMessage } from '@/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { toast, ToastContainer } from '@/components/common/Toast';
import Link from 'next/link';

async function fetchThreads(): Promise<DmThread[]> {
  const res = await fetch('/api/dm');
  if (!res.ok) return [];
  const { data } = await res.json();
  return data || [];
}

async function fetchThread(id: string): Promise<{ thread: DmThread; messages: DmMessage[] }> {
  const res = await fetch(`/api/dm/${id}`);
  if (!res.ok) throw new Error('Failed to load');
  const { data } = await res.json();
  return data;
}

export default function MessagesClient() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeThread, setActiveThread] = useState<string | null>(searchParams.get('thread'));
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: threads = [], isLoading } = useQuery({
    queryKey: ['dm-threads'],
    queryFn: fetchThreads,
    enabled: !!user,
    refetchInterval: 10_000,
  });

  const { data: threadData, isLoading: loadingThread } = useQuery({
    queryKey: ['dm-thread', activeThread],
    queryFn: () => fetchThread(activeThread!),
    enabled: !!activeThread && !!user,
    refetchInterval: 3_000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadData?.messages]);

  useEffect(() => {
    if (!activeThread || !user) return;
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`thread-${activeThread}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dm_messages', filter: `thread_id=eq.${activeThread}` }, () => {
        qc.invalidateQueries({ queryKey: ['dm-thread', activeThread] });
        qc.invalidateQueries({ queryKey: ['dm-threads'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeThread, user, qc]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeThread || !user) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');
    try {
      const res = await fetch(`/api/dm/${activeThread}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Send failed');
      qc.invalidateQueries({ queryKey: ['dm-thread', activeThread] });
      qc.invalidateQueries({ queryKey: ['dm-threads'] });
    } catch {
      setNewMessage(content);
      toast('Failed to send', 'error');
    } finally { setSending(false); }
  };

  if (!user) return (
    <main className="flex-1 pt-14 pb-14 sm:pb-0 flex items-center justify-center">
      <div className="text-center">
        <p className="text-ivory-muted mb-4">Sign in to view messages</p>
        <Link href="/auth" className="btn-gold rounded-full px-6 py-2.5">Sign In</Link>
      </div>
    </main>
  );

  const activeThreadData = threadData?.thread;
  const messages = threadData?.messages || [];
  const otherUser = activeThreadData
    ? (user.id === activeThreadData.buyer_id ? activeThreadData.seller : activeThreadData.buyer)
    : null;

  return (
    <main className="flex-1 pt-14 pb-14 sm:pb-0 max-w-4xl mx-auto w-full flex overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
      <ToastContainer />
      {/* Thread list */}
      <div className={cn('w-full sm:w-80 border-r border-[#1e1e1e] flex-shrink-0 overflow-y-auto', activeThread && 'hidden sm:block')}>
        <div className="px-4 py-3 border-b border-[#1e1e1e] sticky top-0 bg-obsidian/95 backdrop-blur-sm z-10">
          <h2 className="font-semibold text-ivory">Messages</h2>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-full skeleton flex-shrink-0" />
                <div className="flex-1 space-y-2"><div className="h-3 skeleton rounded w-3/4" /><div className="h-2 skeleton rounded w-1/2" /></div>
              </div>
            ))}
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <MessageCircle className="w-10 h-10 text-[#333] mb-3" />
            <p className="text-sm text-ivory-muted">No messages yet</p>
            <p className="text-xs text-ivory-subtle mt-1">DM a seller from their listing</p>
          </div>
        ) : (
          <div>
            {threads.map(thread => {
              const other = user.id === thread.buyer_id ? thread.seller : thread.buyer;
              const unread = user.id === thread.buyer_id ? thread.buyer_unread : thread.seller_unread;
              const postImg = thread.gem_posts?.gem_images?.find((i: { is_primary: boolean }) => i.is_primary) ?? thread.gem_posts?.gem_images?.[0];
              const lastMsg = (thread as unknown as { last_message?: DmMessage }).last_message;
              return (
                <button key={thread.id} onClick={() => setActiveThread(thread.id)}
                  className={cn('w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-[#0f0f0f] transition-colors border-b border-[#111]', activeThread === thread.id && 'bg-[#0f0f0f]')}>
                  {postImg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getImageUrl(postImg.url)} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <Avatar src={other?.avatar_url} username={other?.username} size="md" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={cn('text-sm font-semibold truncate', unread ? 'text-ivory' : 'text-ivory-muted')}>@{other?.username}</span>
                      <span className="text-[10px] text-ivory-subtle ml-2 flex-shrink-0">{formatRelativeDate(thread.last_message_at)}</span>
                    </div>
                    {thread.gem_posts && <p className="text-[10px] text-gold truncate">{thread.gem_posts.title}</p>}
                    {lastMsg && (
                      <p className={cn('text-xs truncate mt-0.5', unread ? 'text-ivory font-medium' : 'text-ivory-subtle')}>
                        {lastMsg.sender_id === user.id ? 'You: ' : ''}{lastMsg.content}
                      </p>
                    )}
                  </div>
                  {(unread || 0) > 0 && (
                    <div className="w-5 h-5 rounded-full bg-gold text-obsidian text-[9px] font-bold flex items-center justify-center flex-shrink-0">{unread}</div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat area */}
      {activeThread ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1e1e1e] flex items-center gap-3 bg-obsidian sticky top-0 z-10">
            <button onClick={() => setActiveThread(null)} className="sm:hidden btn-icon w-7 h-7"><ArrowLeft className="w-4 h-4" /></button>
            {otherUser && (
              <Link href={`/profile/${otherUser.username}`} className="flex items-center gap-2 flex-1 min-w-0">
                <Avatar src={otherUser.avatar_url} username={otherUser.username} size="sm" ring />
                <span className="font-semibold text-sm text-ivory">@{otherUser.username}</span>
              </Link>
            )}
            {activeThreadData?.gem_posts && (
              <Link href={`/post/${activeThreadData.post_id}`} className="text-xs text-gold truncate max-w-32 hover:underline">
                💎 {activeThreadData.gem_posts.title}
              </Link>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadingThread ? (
              <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-gold animate-spin" /></div>
            ) : messages.map(msg => {
              const isMe = msg.sender_id === user.id;
              return (
                <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[75%] px-4 py-2.5 rounded-2xl text-sm', isMe ? 'bg-gold text-obsidian rounded-br-sm' : 'bg-[#1a1a1a] text-ivory rounded-bl-sm border border-[#2a2a2a]')}>
                    <p className="leading-relaxed">{msg.content}</p>
                    <p className={cn('text-[9px] mt-1', isMe ? 'text-obsidian/60' : 'text-ivory-subtle')}>
                      {formatRelativeDate(msg.created_at)}{isMe && msg.is_read && ' · seen'}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-4 py-3 border-t border-[#1e1e1e] flex gap-2 bg-obsidian">
            <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
              placeholder="Message..." className="input flex-1 py-2.5"
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} />
            <button onClick={sendMessage} disabled={!newMessage.trim() || sending}
              className="btn-gold w-10 h-10 rounded-full p-0 flex-shrink-0">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      ) : (
        <div className="hidden sm:flex flex-1 items-center justify-center text-center">
          <div>
            <MessageCircle className="w-12 h-12 text-[#222] mx-auto mb-3" />
            <p className="text-ivory-muted text-sm">Select a conversation</p>
          </div>
        </div>
      )}
    </main>
  );
}
