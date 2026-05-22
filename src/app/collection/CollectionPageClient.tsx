'use client';

import { CollectionManager } from '@/components/collections/CollectionManager';

export default function CollectionPageClient({ userId }: { userId: string }) {
  return (
    <div className="min-h-screen bg-obsidian pb-24">
      <div className="max-w-lg mx-auto px-3 pt-4">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-ivory">My Collection</h1>
          <p className="text-xs text-ivory-muted mt-0.5">Track gems you own — not for sale</p>
        </div>
        <CollectionManager userId={userId} isOwner />
      </div>
    </div>
  );
}
