import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SellerAnalyticsDashboard } from '@/components/analytics/SellerAnalytics';
import { MarketTrends } from '@/components/analytics/MarketTrends';

export const metadata = { title: 'Analytics · GemGram' };

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-obsidian pb-24">
      <div className="max-w-lg mx-auto px-3 pt-4">
        {/* Page title */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-ivory">Analytics</h1>
          <p className="text-xs text-ivory-muted mt-0.5">Your listing performance &amp; market insights</p>
        </div>

        {/* Tabs */}
        <Tabs sellerId={user.id} />
      </div>
    </div>
  );
}

// Client component for tabs
import AnalyticsTabs from './AnalyticsTabs';

async function Tabs({ sellerId }: { sellerId: string }) {
  return <AnalyticsTabs sellerId={sellerId} />;
}
