import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Feed } from '@/components/feed/Feed';
import { StoriesBar } from '@/components/stories/StoriesBar';
import { ToastContainer } from '@/components/common/Toast';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-obsidian">
      <Navbar />
      <main className="pt-14 pb-16 sm:pb-0 max-w-lg mx-auto">
        <StoriesBar />
        <Feed />
      </main>
      <BottomNav />
      <ToastContainer />
    </div>
  );
}
