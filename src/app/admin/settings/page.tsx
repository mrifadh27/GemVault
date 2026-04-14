'use client';
import { useState } from 'react';
import { useUIStore } from '@/stores/ui.store';
import { Save } from 'lucide-react';

export default function AdminSettingsPage() {
  const { addToast } = useUIStore();
  const [settings, setSettings] = useState({ platform_fee_rate: 8.0, min_payout_amount: 50, payout_schedule: 'weekly' });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
    if (res.ok) addToast({ title: 'Settings saved', variant: 'success' });
    else addToast({ title: 'Failed to save', variant: 'error' });
  };
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ivory font-light">Platform Settings</h1>
      <form onSubmit={handleSubmit} className="card p-6 space-y-5 max-w-lg">
        <div><label className="label">Platform Fee Rate (%)</label><input type="number" step="0.1" min="0" max="50" value={settings.platform_fee_rate} onChange={e => setSettings(p => ({...p, platform_fee_rate: parseFloat(e.target.value)}))} className="input" /></div>
        <div><label className="label">Min Payout Amount ($)</label><input type="number" step="1" min="0" value={settings.min_payout_amount} onChange={e => setSettings(p => ({...p, min_payout_amount: parseFloat(e.target.value)}))} className="input" /></div>
        <div><label className="label">Payout Schedule</label><select value={settings.payout_schedule} onChange={e => setSettings(p => ({...p, payout_schedule: e.target.value}))} className="select"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
        <button type="submit" className="btn-gold gap-2"><Save className="w-4 h-4" />Save Settings</button>
      </form>
    </div>
  );
}
