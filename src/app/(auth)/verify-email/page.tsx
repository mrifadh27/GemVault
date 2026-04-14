import Link from 'next/link';
export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 hero-mesh pt-16">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">📬</div>
        <h1 className="font-serif text-4xl text-ivory font-light mb-3">Check your inbox</h1>
        <p className="text-ivory-muted mb-8">We sent you a confirmation email. Click the link to activate your GemVault account.</p>
        <Link href="/login" className="btn-gold">Back to Sign In</Link>
      </div>
    </div>
  );
}
