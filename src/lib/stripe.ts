import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
});

// ============================================================
// STRIPE HELPERS
// ============================================================

/**
 * Create a PaymentIntent for an order
 */
export async function createPaymentIntent({
  amount,
  currency = 'usd',
  orderId,
  buyerId,
  metadata = {},
}: {
  amount: number;
  currency?: string;
  orderId: string;
  buyerId: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    metadata: {
      order_id: orderId,
      buyer_id: buyerId,
      ...metadata,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });
}

/**
 * Create a Stripe Connect account for a seller
 */
export async function createConnectAccount(email: string): Promise<Stripe.Account> {
  return stripe.accounts.create({
    type: 'express',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',
  });
}

/**
 * Generate Stripe Connect onboarding link
 */
export async function createAccountLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
): Promise<Stripe.AccountLink> {
  return stripe.accountLinks.create({
    account: accountId,
    return_url: returnUrl,
    refresh_url: refreshUrl,
    type: 'account_onboarding',
  });
}

/**
 * Transfer funds to seller after successful order
 */
export async function transferToSeller({
  sellerId,
  stripeAccountId,
  amount,
  currency = 'usd',
  orderId,
}: {
  sellerId: string;
  stripeAccountId: string;
  amount: number;
  currency?: string;
  orderId: string;
}): Promise<Stripe.Transfer> {
  return stripe.transfers.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    destination: stripeAccountId,
    metadata: {
      seller_id: sellerId,
      order_id: orderId,
    },
  });
}

/**
 * Retrieve Stripe account details
 */
export async function getAccount(accountId: string): Promise<Stripe.Account> {
  return stripe.accounts.retrieve(accountId);
}

/**
 * Create a payout for a seller
 */
export async function createPayout(
  amount: number,
  stripeAccountId: string,
  currency = 'usd'
): Promise<Stripe.Payout> {
  return stripe.payouts.create(
    {
      amount: Math.round(amount * 100),
      currency,
    },
    {
      stripeAccount: stripeAccountId,
    }
  );
}

/**
 * Issue a refund for a PaymentIntent
 */
export async function refundPaymentIntent(
  paymentIntentId: string,
  amount?: number
): Promise<Stripe.Refund> {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    ...(amount ? { amount: Math.round(amount * 100) } : {}),
  });
}

/**
 * Verify Stripe webhook signature
 */
export function constructWebhookEvent(
  body: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(body, signature, secret);
}

/**
 * Get balance for a connected account
 */
export async function getAccountBalance(
  stripeAccountId: string
): Promise<Stripe.Balance> {
  return stripe.balance.retrieve({
    stripeAccount: stripeAccountId,
  });
}

export type { Stripe };
