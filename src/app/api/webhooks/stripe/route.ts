import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent, transferToSeller } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { sendOrderConfirmationEmail, sendNewSaleEmail } from '@/lib/resend';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event;
  try {
    event = constructWebhookEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = await createServiceClient();

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any;
        const orderId = paymentIntent.metadata?.order_id;

        if (!orderId) break;

        // Update order status
        const { data: order } = await supabase
          .from('orders')
          .update({
            status: 'confirmed',
            payment_status: 'paid',
          })
          .eq('id', orderId)
          .eq('payment_intent_id', paymentIntent.id)
          .select(`
            *,
            order_items (
              *,
              products (id, name, slug, carat_weight, gemstone_type, product_images (url, is_primary)),
              seller_profiles (id, store_name, stripe_account_id, stripe_onboarding_complete,
                profiles (email, full_name))
            ),
            profiles (id, email, full_name)
          `)
          .single();

        if (!order) break;

        // Update order items to confirmed
        await supabase
          .from('order_items')
          .update({ status: 'confirmed' })
          .eq('order_id', orderId);

        const buyer = (order as any).profiles;
        const orderItems: any[] = (order as any).order_items ?? [];

        // Send buyer confirmation email
        if (buyer?.email) {
          await sendOrderConfirmationEmail(buyer, order as any).catch(console.error);
        }

        // Buyer notification
        await supabase.from('notifications').insert({
          user_id: (order as any).buyer_id,
          type: 'order_update',
          title: 'Order confirmed!',
          message: `Your order #${orderId.slice(0, 8).toUpperCase()} has been confirmed.`,
          data: { order_id: orderId },
        });

        // Process per-seller transfers and notifications
        const sellerGroups: Record<string, typeof orderItems> = {};
        for (const item of orderItems) {
          if (!sellerGroups[item.seller_id]) sellerGroups[item.seller_id] = [];
          sellerGroups[item.seller_id].push(item);
        }

        for (const [sellerId, items] of Object.entries(sellerGroups)) {
          const sellerProfile = items[0]?.seller_profiles;
          const totalEarnings = items.reduce((sum: number, i: any) => sum + i.seller_earnings, 0);

          // Stripe transfer to seller
          if (
            sellerProfile?.stripe_account_id &&
            sellerProfile?.stripe_onboarding_complete
          ) {
            await transferToSeller({
              sellerId,
              stripeAccountId: sellerProfile.stripe_account_id,
              amount: totalEarnings,
              currency: 'usd',
              orderId,
            }).catch(console.error);
          }

          // Seller notification
          await supabase.from('notifications').insert({
            user_id: sellerId,
            type: 'new_sale',
            title: 'New sale!',
            message: `You have a new order worth $${totalEarnings.toFixed(2)}.`,
            data: { order_id: orderId, earnings: totalEarnings },
          });

          // Seller email
          const sellerEmail = sellerProfile?.profiles?.email;
          const sellerName = sellerProfile?.store_name ?? sellerProfile?.profiles?.full_name ?? 'Seller';
          if (sellerEmail) {
            await sendNewSaleEmail(sellerEmail, sellerName, order as any).catch(console.error);
          }

          // Check low stock for sold items
          for (const item of items) {
            const product = item.products;
            if (!product) continue;
            const newStock = product.stock_quantity - item.quantity;
            if (newStock <= (product.low_stock_threshold ?? 3) && newStock >= 0) {
              await supabase.from('notifications').insert({
                user_id: sellerId,
                type: 'low_stock',
                title: 'Low stock alert',
                message: `${product.name} has only ${newStock} units remaining.`,
                data: { product_id: product.id, stock: newStock },
              });
            }
          }
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any;
        const orderId = paymentIntent.metadata?.order_id;
        if (!orderId) break;

        await supabase
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('id', orderId)
          .eq('payment_intent_id', paymentIntent.id);

        // Notify buyer
        const { data: order } = await supabase
          .from('orders')
          .select('buyer_id')
          .eq('id', orderId)
          .single();

        if (order) {
          await supabase.from('notifications').insert({
            user_id: (order as any).buyer_id,
            type: 'order_update',
            title: 'Payment failed',
            message: 'Your payment could not be processed. Please try again.',
            data: { order_id: orderId },
          });
        }
        break;
      }

      case 'account.updated': {
        // Stripe Connect account updated
        const account = event.data.object as any;
        if (account.charges_enabled && account.payouts_enabled) {
          await supabase
            .from('seller_profiles')
            .update({ stripe_onboarding_complete: true })
            .eq('stripe_account_id', account.id);
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
