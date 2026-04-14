'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getAvatarUrl } from '@/lib/utils';
import { User, Camera, Save, Loader2 } from 'lucide-react';

export default function BuyerProfilePage() {
  const { user, fetchProfile } = useAuthStore();
  const { addToast } = useUIStore();
  const supabase = getSupabaseBrowserClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name ?? '',
    phone: user?.phone ?? '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: formData.full_name, phone: formData.phone })
        .eq('id', user.id);

      if (error) throw error;
      await fetchProfile();
      addToast({ title: 'Profile updated', variant: 'success' });
    } catch {
      addToast({ title: 'Failed to update profile', variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-ivory font-light">My Profile</h1>
        <p className="text-ivory-muted text-sm mt-1">Manage your account details</p>
      </div>

      <div className="card p-6">
        {/* Avatar */}
        <div className="flex items-center gap-5 mb-8 pb-6 border-b border-obsidian-border">
          <div className="relative">
            <img
              src={getAvatarUrl(user?.avatar_url, user?.full_name ?? undefined)}
              alt={user?.full_name ?? 'Profile'}
              className="w-20 h-20 rounded-full object-cover border-2 border-obsidian-border"
            />
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-gold text-obsidian flex items-center justify-center cursor-pointer hover:bg-gold-light transition-colors">
              <Camera className="w-3 h-3" />
            </div>
          </div>
          <div>
            <p className="font-serif text-xl text-ivory">{user?.full_name ?? 'Your Name'}</p>
            <p className="text-sm text-ivory-muted">{user?.email}</p>
            <p className="text-xs text-ivory-subtle mt-0.5 capitalize">
              {user?.role} account {user?.is_verified ? '· Verified' : ''}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-subtle" />
              <input
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="input pl-10"
                placeholder="Your full name"
              />
            </div>
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={user?.email ?? ''}
              disabled
              className="input opacity-50 cursor-not-allowed"
            />
            <p className="text-xs text-ivory-subtle mt-1">Email cannot be changed.</p>
          </div>

          <div>
            <label className="label">Phone</label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input"
              placeholder="+1 555 000 0000"
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-gold gap-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
