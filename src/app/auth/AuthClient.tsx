'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, Mail, Lock, User, AtSign } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { toast, ToastContainer } from '@/components/common/Toast';

type Mode = 'login' | 'signup' | 'magic';

export default function AuthClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace(next);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async () => {
    if (!email || !password) { toast('Please fill in all fields', 'error'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace(next);
    } catch (err: unknown) {
      toast((err as Error).message, 'error');
    } finally { setLoading(false); }
  };

  const handleSignup = async () => {
    if (!email || !password || !username) { toast('Please fill in all fields', 'error'); return; }
    if (password.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      toast('Username: 3–20 chars, letters/numbers/underscores only', 'error'); return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: {
          data: { username: username.toLowerCase(), full_name: fullName || username },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      toast('Account created! Check your email to confirm.', 'success');
      setMode('login');
    } catch (err: unknown) {
      toast((err as Error).message, 'error');
    } finally { setLoading(false); }
  };

  const handleMagicLink = async () => {
    if (!email) { toast('Enter your email', 'error'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}${next}` },
      });
      if (error) throw error;
      setMagicSent(true);
    } catch (err: unknown) {
      toast((err as Error).message, 'error');
    } finally { setLoading(false); }
  };

  const handleOAuth = async (provider: 'google') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${next}` },
    });
    if (error) toast(error.message, 'error');
  };

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center px-4">
      <ToastContainer />
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💎</div>
          <h1 className="font-serif text-3xl text-ivory font-light tracking-wide">GemGram</h1>
          <p className="text-sm text-ivory-muted mt-1.5">The Instagram for gem lovers</p>
        </div>

        <div className="card p-6">
          <div className="flex rounded-lg bg-[#0f0f0f] p-1 mb-6">
            {(['login', 'signup', 'magic'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${mode === m ? 'bg-gold text-obsidian' : 'text-ivory-muted hover:text-ivory'}`}
              >
                {m === 'login' ? 'Sign In' : m === 'signup' ? 'Sign Up' : '✉️ Magic'}
              </button>
            ))}
          </div>

          {magicSent ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">📬</div>
              <p className="font-medium text-ivory mb-1">Check your inbox</p>
              <p className="text-sm text-ivory-muted">Magic link sent to <strong>{email}</strong></p>
              <button onClick={() => setMagicSent(false)} className="mt-4 text-xs text-gold hover:text-gold-light">
                Use a different email
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-subtle" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Email address" className="input pl-10" autoComplete="email"
                  onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : mode === 'magic' ? handleMagicLink() : null)} />
              </div>

              {mode !== 'magic' && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-subtle" />
                  <input type={showPassword ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="Password"
                    className="input pl-10 pr-10"
                    onKeyDown={e => e.key === 'Enter' && mode === 'login' && handleLogin()}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                  <button onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ivory-subtle hover:text-ivory">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {mode === 'signup' && (
                <>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-subtle" />
                    <input type="text" value={username}
                      onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="username" className="input pl-10" maxLength={20} autoComplete="username" />
                  </div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-subtle" />
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                      placeholder="Full name (optional)" className="input pl-10" />
                  </div>
                </>
              )}

              <button
                onClick={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleMagicLink}
                disabled={loading}
                className="btn-gold w-full justify-center py-3 rounded-lg mt-1"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" />
                  : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Magic Link'}
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-[#222]" />
                <span className="text-xs text-ivory-subtle">or</span>
                <div className="flex-1 h-px bg-[#222]" />
              </div>

              <button onClick={() => handleOAuth('google')} className="btn-outline w-full justify-center py-2.5 gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-ivory-subtle mt-4">By continuing, you agree to our Terms &amp; Privacy Policy.</p>
      </div>
    </div>
  );
}
