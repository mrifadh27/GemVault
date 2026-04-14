'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Store, ArrowRight, Chrome } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { loginSchema, registerSchema, forgotPasswordSchema, type LoginFormData, type RegisterFormData, type ForgotPasswordFormData } from '@/lib/validations';
import { cn } from '@/lib/utils';

function AuthCard({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16 pb-8 hero-mesh">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="font-serif text-2xl text-gold tracking-[0.2em]">✦ GEMVAULT</span>
          </Link>
          <h1 className="font-serif text-3xl text-ivory font-light">{title}</h1>
          <p className="text-ivory-muted text-sm mt-2">{subtitle}</p>
        </div>
        <div className="card p-8">{children}</div>
      </motion.div>
    </div>
  );
}

// ============================================================
// LoginForm
// ============================================================
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/marketplace';
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const supabase = getSupabaseBrowserClient();

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    setServerError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) { setServerError(error.message); return; }
    router.push(redirect);
    router.refresh();
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback?redirect=${redirect}` },
    });
  };

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to your GemVault account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-subtle" />
            <input {...register('email')} type="email" className="input pl-10" placeholder="you@example.com" />
          </div>
          {errors.email && <p className="error-text">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="label mb-0">Password</label>
            <Link href="/forgot-password" className="text-xs text-gold hover:text-gold-light">Forgot?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-subtle" />
            <input {...register('password')} type={showPassword ? 'text' : 'password'} className="input pl-10 pr-10" placeholder="••••••••" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ivory-subtle hover:text-ivory">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="error-text">{errors.password.message}</p>}
        </div>

        {serverError && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{serverError}</div>
        )}

        <button type="submit" disabled={isSubmitting} className="btn-gold w-full justify-center">
          {isSubmitting ? 'Signing in…' : 'Sign In'}
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="relative my-2">
          <div className="divider my-0" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-obsidian-mid px-3 text-xs text-ivory-subtle">or</span>
        </div>

        <button type="button" onClick={signInWithGoogle} className="btn-outline w-full justify-center gap-2">
          <Chrome className="w-4 h-4" />
          Continue with Google
        </button>
      </form>

      <p className="text-center text-sm text-ivory-muted mt-6">
        New to GemVault?{' '}
        <Link href="/register" className="text-gold hover:text-gold-light">Create account</Link>
      </p>
    </AuthCard>
  );
}

// ============================================================
// RegisterForm
// ============================================================
export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const supabase = getSupabaseBrowserClient();

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<RegisterFormData>({ resolver: zodResolver(registerSchema), defaultValues: { role: 'buyer' } });

  const role = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    setServerError('');

    // Check store name uniqueness
    if (data.role === 'seller' && data.store_name) {
      const { data: existing } = await supabase.from('seller_profiles').select('id').eq('store_name', data.store_name).maybeSingle();
      if (existing) { setServerError('Store name already taken. Please choose another.'); return; }
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.full_name, role: data.role } },
    });

    if (error) { setServerError(error.message); return; }

    if (authData.user) {
      // Create profile
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
      });

      // Create seller profile if needed
      if (data.role === 'seller' && data.store_name) {
        await supabase.from('seller_profiles').upsert({
          id: authData.user.id,
          store_name: data.store_name,
          verification_status: 'pending',
        });
      }
    }

    router.push('/verify-email');
  };

  const signUpWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  };

  return (
    <AuthCard title="Create your account" subtitle="Join thousands of gem enthusiasts and sellers">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3 mb-2">
          {(['buyer', 'seller'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setValue('role', r)}
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all',
                role === r
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-obsidian-border text-ivory-muted hover:border-gold/30'
              )}
            >
              {r === 'buyer' ? <User className="w-4 h-4" /> : <Store className="w-4 h-4" />}
              {r === 'buyer' ? 'Shop as Buyer' : 'Sell on GemVault'}
            </button>
          ))}
        </div>

        <div>
          <label className="label">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-subtle" />
            <input {...register('full_name')} className="input pl-10" placeholder="Your full name" />
          </div>
          {errors.full_name && <p className="error-text">{errors.full_name.message}</p>}
        </div>

        {role === 'seller' && (
          <div>
            <label className="label">Store Name</label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-subtle" />
              <input {...register('store_name')} className="input pl-10" placeholder="Your store name" />
            </div>
            {errors.store_name && <p className="error-text">{errors.store_name.message}</p>}
          </div>
        )}

        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-subtle" />
            <input {...register('email')} type="email" className="input pl-10" placeholder="you@example.com" />
          </div>
          {errors.email && <p className="error-text">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-subtle" />
            <input {...register('password')} type={showPassword ? 'text' : 'password'} className="input pl-10 pr-10" placeholder="Minimum 8 characters" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ivory-subtle hover:text-ivory">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="error-text">{errors.password.message}</p>}
        </div>

        <div>
          <label className="label">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-subtle" />
            <input {...register('confirmPassword')} type="password" className="input pl-10" placeholder="Repeat password" />
          </div>
          {errors.confirmPassword && <p className="error-text">{errors.confirmPassword.message}</p>}
        </div>

        {serverError && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{serverError}</div>
        )}

        <button type="submit" disabled={isSubmitting} className="btn-gold w-full justify-center">
          {isSubmitting ? 'Creating account…' : 'Create Account'}
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="relative my-2">
          <div className="divider my-0" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-obsidian-mid px-3 text-xs text-ivory-subtle">or</span>
        </div>

        <button type="button" onClick={signUpWithGoogle} className="btn-outline w-full justify-center gap-2">
          <Chrome className="w-4 h-4" />
          Continue with Google
        </button>
      </form>

      <p className="text-center text-sm text-ivory-muted mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-gold hover:text-gold-light">Sign in</Link>
      </p>
    </AuthCard>
  );
}

// ============================================================
// ForgotPasswordForm
// ============================================================
export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const supabase = getSupabaseBrowserClient();

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ForgotPasswordFormData>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSent(true);
  };

  return (
    <AuthCard title="Reset password" subtitle="We'll send you a reset link">
      {sent ? (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-400/10 border border-green-400/20 flex items-center justify-center mx-auto">
            <Mail className="w-7 h-7 text-green-400" />
          </div>
          <p className="text-ivory">Check your email</p>
          <p className="text-sm text-ivory-muted">We sent you a password reset link. It expires in 1 hour.</p>
          <Link href="/login" className="btn-ghost">Back to Sign In</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-subtle" />
              <input {...register('email')} type="email" className="input pl-10" placeholder="you@example.com" />
            </div>
            {errors.email && <p className="error-text">{errors.email.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-gold w-full justify-center">
            {isSubmitting ? 'Sending…' : 'Send Reset Link'}
          </button>
          <Link href="/login" className="btn-ghost w-full justify-center text-sm">Back to Sign In</Link>
        </form>
      )}
    </AuthCard>
  );
}
