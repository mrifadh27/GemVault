'use client';

import { useRouter } from 'next/navigation';
import { OriginMap } from '@/components/map/OriginMap';

export default function MapPageClient() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-obsidian pb-24">
      <div className="max-w-lg mx-auto px-3 pt-4">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-ivory">Origin Explorer</h1>
          <p className="text-xs text-ivory-muted mt-0.5">Browse gems by mining origin worldwide</p>
        </div>
        <OriginMap onSelectOrigin={(country) => router.push(`/explore?origin_country=${encodeURIComponent(country)}`)} />
      </div>
    </div>
  );
}
