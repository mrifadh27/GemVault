import { GroupsContent } from '@/components/groups/GroupCard';

export const metadata = { title: 'Gem Groups · GemGram' };

export default function GroupsPage() {
  return (
    <div className="min-h-screen bg-obsidian pb-24">
      <div className="max-w-lg mx-auto px-3 pt-4">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-ivory">Gem Groups</h1>
          <p className="text-xs text-ivory-muted mt-0.5">Collector communities by gem type &amp; origin</p>
        </div>
        <GroupsContent />
      </div>
    </div>
  );
}
