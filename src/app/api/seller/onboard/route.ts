import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createConnectAccount, createAccountLink, getAccount } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, role')
      .eq('id', user.id)
      .single();

    if (!['seller', 'admin'].includes(profile?.role ?? '')) {
      return NextResponse.json({ error: 'Must be a seller' }, { status: 403 });
    }

    const { data: sellerProfile } = await supabase
      .from('seller_profiles')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('id', user.id)
      .single();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const returnUrl = `${appUrl}/seller/settings?stripe=success`;
    const refreshUrl = `${appUrl}/seller/settings?stripe=refresh`;

    let stripeAccountId = sellerProfile?.stripe_account_id;

    // Create account if it doesn't exist
    if (!stripeAccountId) {
      const account = await createConnectAccount(profile!.email);
      stripeAccountId = account.id;

      await supabase
        .from('seller_profiles')
        .update({ stripe_account_id: stripeAccountId })
        .eq('id', user.id);
    } else {
      // Check if already complete
      const account = await getAccount(stripeAccountId);
      if (account.charges_enabled && account.payouts_enabled) {
        await supabase
          .from('seller_profiles')
          .update({ stripe_onboarding_complete: true })
          .eq('id', user.id);

        return NextResponse.json({ onboarding_complete: true });
      }
    }

    // Generate onboarding link
    const accountLink = await createAccountLink(stripeAccountId, returnUrl, refreshUrl);

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error('POST /api/seller/onboard error:', err);
    return NextResponse.json({ error: 'Failed to create Stripe onboarding link' }, { status: 500 });
  }
}
