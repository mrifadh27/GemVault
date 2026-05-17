'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Camera } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/common/Avatar';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { toast, ToastContainer } from '@/components/common/Toast';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(profile?.username || '');
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp_number || '');
  const [instagram, setInstagram] = useState(profile?.instagram_handle || '');
  const [telegram, setTelegram] = useState(profile?.telegram_handle || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let avatarUrl = profile?.avatar_url;

      // Upload new avatar if selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        formData.append('bucket', 'avatars');
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Failed to upload avatar');
        const { url } = await res.json();
        avatarUrl = url;
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          full_name: fullName.trim() || null,
          bio: bio.trim() || null,
          location: location.trim() || null,
          avatar_url: avatarUrl,
          whatsapp_number: whatsapp.trim() || null,
          instagram_handle: instagram.trim() || null,
          telegram_handle: telegram.trim() || null,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Failed to save');
      }

      await refreshProfile();
      toast('Profile updated! ✨', 'success');
      setTimeout(() => router.push(`/profile/${username.trim().toLowerCase()}`), 800);
    } catch (err: unknown) {
      toast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian">
      <Navbar />
      <ToastContainer />

      <main className="pt-14 pb-20 sm:pb-8 max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="btn-icon">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-serif text-2xl text-ivory font-light">Edit Profile</h1>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <Avatar
              src={avatarPreview || profile?.avatar_url}
              username={profile?.username}
              size="xl"
              ring
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gold text-obsidian flex items-center justify-center shadow-lg hover:bg-gold-light transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <button onClick={() => fileInputRef.current?.click()} className="mt-2 text-xs text-gold hover:text-gold-light transition-colors">
            Change Photo
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Username *</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="your_username"
              className="input"
              maxLength={20}
            />
          </div>
          <div>
            <label className="label">Full Name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" className="input" />
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell buyers about yourself..." rows={3} className="input resize-none" maxLength={200} />
          </div>
          <div>
            <label className="label">Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Bangkok, Thailand" className="input" />
          </div>

          <div className="divider" />
          <p className="text-xs text-ivory-muted font-semibold uppercase tracking-wider">Contact for Buyers</p>

          <div>
            <label className="label">📱 WhatsApp Number</label>
            <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+1 555 000 0000" className="input" />
          </div>
          <div>
            <label className="label">📸 Instagram Handle</label>
            <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@yourusername" className="input" />
          </div>
          <div>
            <label className="label">✈️ Telegram Handle</label>
            <input value={telegram} onChange={e => setTelegram(e.target.value)} placeholder="@yourtelegram" className="input" />
          </div>

          <button onClick={handleSave} disabled={saving || !username} className="btn-gold w-full justify-center py-3.5 rounded-2xl text-base mt-2">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
