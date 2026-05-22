import { KnowledgeHub } from '@/components/knowledge/KnowledgeHub';

export const metadata = { title: 'Knowledge Hub · GemGram' };

export default function KnowledgePage() {
  return (
    <div className="min-h-screen bg-obsidian pb-24">
      <div className="max-w-lg mx-auto px-3 pt-4">
        <KnowledgeHub />
      </div>
    </div>
  );
}
