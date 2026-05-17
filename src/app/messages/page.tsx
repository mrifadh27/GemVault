import { Suspense } from 'react';
import MessagesClient from './MessagesClient';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-obsidian flex flex-col">
      <Navbar />
      <Suspense fallback={
        <main className="flex-1 pt-14 flex items-center justify-center">
          <span className="text-gold text-2xl animate-pulse">💎</span>
        </main>
      }>
        <MessagesClient />
      </Suspense>
      <BottomNav />
    </div>
  );
}
