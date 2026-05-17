import { Suspense } from 'react';
import AuthClient from './AuthClient';

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-obsidian flex items-center justify-center"><span className="text-gold text-2xl">💎</span></div>}>
      <AuthClient />
    </Suspense>
  );
}
