'use client';

import { useState, useCallback, useRef } from 'react';
import { Heart, Reply, Trash2, Pin, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/components/common/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/common/Toast';
import { cn, formatRelativeDate } from '@/lib/utils';
import type { PostComment } from '@/types';

async function fetchComments(postId: string): Promise<PostComment[]> {
  const res = await fetch(`/api/comments?post_id=${postId}`);
  if (!res.ok) throw new Error('Failed to load comments');
  const { data } = await res.json();
  return data;
}

interface CommentItemProps {
  comment: PostComment;
  postId: string;
  depth?: number;
}

function CommentItem({ comment, postId, depth = 0 }: CommentItemProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [liked, setLiked] = useState(comment.is_liked ?? false);
  const [likesCount, setLikesCount] = useState(comment.likes_count ?? 0);
  const [showReplies, setShowReplies] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/comments?id=${comment.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', postId] });
      toast('Comment deleted', 'info');
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: comment.id, liked }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const replyMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, content, parent_id: comment.id }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', postId] });
      setReplyText('');
      setReplyOpen(false);
      setShowReplies(true);
    },
  });

  const handleLike = useCallback(async () => {
    if (!user) { toast('Sign in to like comments', 'info'); return; }
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikesCount(c => wasLiked ? c - 1 : c + 1);
    try { await likeMutation.mutateAsync(); } catch {
      setLiked(wasLiked);
      setLikesCount(c => wasLiked ? c + 1 : c - 1);
    }
  }, [liked, user, likeMutation]);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try { await replyMutation.mutateAsync(replyText.trim()); }
    catch { toast('Failed to post reply', 'error'); }
  };

  const replies = comment.replies || [];

  return (
    <div className={cn('flex gap-2.5', depth > 0 && 'ml-8 border-l border-[#1e1e1e] pl-3')}>
      <Avatar
        src={comment.profiles?.avatar_url}
        username={comment.profiles?.username}
        size="xs"
      />
      <div className="flex-1 min-w-0">
        <div className="bg-[#111] rounded-xl px-3 py-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-semibold text-ivory">@{comment.profiles?.username}</span>
            {comment.profiles?.is_verified && (
              <span className="text-gold text-[9px]">✓</span>
            )}
            {comment.is_pinned && (
              <span className="text-[9px] text-gold/70 flex items-center gap-0.5">
                <Pin className="w-2.5 h-2.5" /> pinned
              </span>
            )}
          </div>
          <p className="text-sm text-ivory-muted leading-relaxed break-words">{comment.content}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-1 ml-1">
          <span className="text-[10px] text-ivory-subtle">{formatRelativeDate(comment.created_at)}</span>

          <button onClick={handleLike} className="flex items-center gap-1 group">
            <Heart
              className={cn('w-3 h-3 transition-colors', liked ? 'text-red-400 fill-red-400' : 'text-ivory-subtle group-hover:text-ivory-muted')}
            />
            {likesCount > 0 && (
              <span className="text-[10px] text-ivory-subtle">{likesCount}</span>
            )}
          </button>

          {depth === 0 && (
            <button
              onClick={() => setReplyOpen(r => !r)}
              className="flex items-center gap-1 text-[10px] text-ivory-subtle hover:text-ivory-muted transition-colors"
            >
              <Reply className="w-3 h-3" /> Reply
            </button>
          )}

          {user?.id === comment.user_id && (
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-1 text-[10px] text-ivory-subtle hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Reply input */}
        {replyOpen && (
          <div className="flex gap-2 mt-2">
            <input
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
              placeholder="Write a reply…"
              className="flex-1 bg-[#111] border border-[#2a2a2a] rounded-full px-3 py-1.5 text-xs text-ivory placeholder:text-[#444] focus:outline-none focus:border-gold transition-colors"
              maxLength={500}
              autoFocus
            />
            <button
              onClick={handleReply}
              disabled={!replyText.trim() || replyMutation.isPending}
              className="w-7 h-7 rounded-full bg-gold/20 hover:bg-gold/30 flex items-center justify-center disabled:opacity-40 transition-colors"
            >
              <Send className="w-3 h-3 text-gold" />
            </button>
          </div>
        )}

        {/* Replies toggle */}
        {replies.length > 0 && (
          <button
            onClick={() => setShowReplies(v => !v)}
            className="flex items-center gap-1 mt-1.5 text-[10px] text-gold/70 hover:text-gold transition-colors"
          >
            {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showReplies ? 'Hide' : `View ${replies.length}`} {replies.length === 1 ? 'reply' : 'replies'}
          </button>
        )}

        {/* Replies */}
        {showReplies && replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} postId={postId} depth={1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface CommentsSectionProps {
  postId: string;
  commentsCount: number;
}

export function CommentsSection({ postId, commentsCount }: CommentsSectionProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchComments(postId),
    staleTime: 30_000,
  });

  const addComment = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, content }),
      });
      if (!res.ok) throw new Error('Failed to post comment');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', postId] });
      setText('');
    },
    onError: () => toast('Failed to post comment', 'error'),
  });

  const handleSubmit = async () => {
    if (!user) { toast('Sign in to comment', 'info'); return; }
    if (!text.trim()) return;
    await addComment.mutateAsync(text.trim());
  };

  return (
    <section className="px-3 pb-4">
      <h2 className="text-xs font-medium text-ivory-muted uppercase tracking-wider mb-3">
        Comments {commentsCount > 0 && `· ${commentsCount}`}
      </h2>

      {/* Add comment */}
      <div className="flex gap-2 mb-4">
        {user && <Avatar src={user ? undefined : undefined} username={user?.email?.split('@')[0]} size="xs" />}
        <div className="flex-1 flex gap-2">
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder={user ? 'Add a comment…' : 'Sign in to comment'}
            disabled={!user}
            maxLength={1000}
            className="flex-1 bg-[#111] border border-[#2a2a2a] rounded-full px-3 py-2 text-sm text-ivory placeholder:text-[#444] focus:outline-none focus:border-gold transition-colors disabled:opacity-40"
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || addComment.isPending || !user}
            className="w-8 h-8 rounded-full bg-gold/20 hover:bg-gold/40 flex items-center justify-center disabled:opacity-40 transition-colors"
          >
            <Send className="w-3.5 h-3.5 text-gold" />
          </button>
        </div>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-2.5">
              <div className="w-6 h-6 rounded-full skeleton" />
              <div className="flex-1 h-12 skeleton rounded-xl" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-ivory-subtle text-center py-4">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-3">
          {comments.map(c => (
            <CommentItem key={c.id} comment={c} postId={postId} />
          ))}
        </div>
      )}
    </section>
  );
}
