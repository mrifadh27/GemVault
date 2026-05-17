import { Suspense } from 'react';
import ExploreClient from './ExploreClient';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-obsidian">
      <Navbar />
      <Suspense fallback={
        <main className="pt-14 pb-20 max-w-2xl mx-auto px-4 py-6">
          <div className="animate-pulse space-y-3">
            <div className="h-10 skeleton rounded-lg" />
            <div className="grid grid-cols-2 gap-0.5">
              {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{aspectRatio:'1/1'}} />)}
            </div>
          </div>
        </main>
      }>
        <ExploreClient />
      </Suspense>
      <BottomNav />
    </div>
  );
}
