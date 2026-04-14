import { Resend } from 'resend';
import type { OrderWithItems, Profile } from '@/types';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'GemVault <noreply@gemvault.com>';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://gemvault.com';

// ============================================================
// EMAIL TEMPLATES
// ============================================================

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>GemVault</title>
  <style>
    body { font-family: Georgia, serif; background: #0a0a0f; color: #e8e0d5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #12121a; border: 1px solid #2a2a3a; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 40px 32px; text-align: center; }
    .logo { font-size: 28px; font-weight: bold; color: #c9a96e; letter-spacing: 4px; text-transform: uppercase; }
    .tagline { color: #8a8a9a; font-size: 13px; margin-top: 8px; }
    .content { padding: 32px; }
    .footer { background: #0d0d15; padding: 24px 32px; text-align: center; color: #555; font-size: 12px; }
    .btn { display: inline-block; background: #c9a96e; color: #0a0a0f; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; letter-spacing: 1px; margin: 16px 0; }
    .divider { border: none; border-top: 1px solid #2a2a3a; margin: 24px 0; }
    h1 { color: #e8e0d5; font-size: 24px; margin: 0 0 16px; }
    h2 { color: #c9a96e; font-size: 18px; margin: 0 0 12px; }
    p { color: #a0a0b0; line-height: 1.6; margin: 0 0 16px; }
    .highlight { color: #c9a96e; }
    .order-item { background: #1a1a2a; border-radius: 8px; padding: 16px; margin: 8px 0; display: flex; align-items: center; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 8px 0; color: #a0a0b0; }
    td:last-child { text-align: right; color: #e8e0d5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">✦ GemVault ✦</div>
      <div class="tagline">Premium Gemstone Marketplace</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} GemVault. All rights reserved.</p>
      <p><a href="${BASE_URL}" style="color: #c9a96e; text-decoration: none;">gemvault.com</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ============================================================
// SEND FUNCTIONS
// ============================================================

export async function sendOrderConfirmationEmail(
  buyer: Profile,
  order: OrderWithItems
): Promise<void> {
  const itemsHtml = order.order_items
    .map(
      (item) => `
      <div class="order-item">
        <div>
          <strong style="color: #e8e0d5">${item.products?.name ?? 'Gemstone'}</strong><br>
          <span style="color: #8a8a9a; font-size: 13px;">
            ${item.products?.carat_weight}ct ${item.products?.gemstone_type}
          </span>
        </div>
        <div style="margin-left: auto; text-align: right;">
          <strong class="highlight">$${item.subtotal.toFixed(2)}</strong><br>
          <span style="color: #8a8a9a; font-size: 12px;">Qty: ${item.quantity}</span>
        </div>
      </div>
    `
    )
    .join('');

  const content = `
    <h1>Order Confirmed! 🎉</h1>
    <p>Hello ${buyer.full_name ?? 'Valued Customer'},</p>
    <p>Your order has been confirmed and our sellers are preparing your gemstones with care.</p>
    
    <h2>Order #${order.id.slice(0, 8).toUpperCase()}</h2>
    ${itemsHtml}
    
    <hr class="divider" />
    
    <table>
      <tr><td>Subtotal</td><td>$${order.subtotal.toFixed(2)}</td></tr>
      <tr><td>Shipping</td><td>$${order.shipping_cost.toFixed(2)}</td></tr>
      <tr><td>Tax</td><td>$${order.tax.toFixed(2)}</td></tr>
      <tr>
        <td><strong style="color: #e8e0d5">Total</strong></td>
        <td><strong class="highlight">$${order.total.toFixed(2)}</strong></td>
      </tr>
    </table>
    
    <hr class="divider" />
    
    <p><strong style="color: #e8e0d5">Shipping to:</strong><br>
    ${order.shipping_address.full_name}<br>
    ${order.shipping_address.address_line1}<br>
    ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.postal_code}</p>
    
    <center>
      <a href="${BASE_URL}/buyer/orders/${order.id}" class="btn">TRACK YOUR ORDER</a>
    </center>
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: buyer.email,
    subject: `Order Confirmed — GemVault #${order.id.slice(0, 8).toUpperCase()}`,
    html: baseTemplate(content),
  });
}

export async function sendNewSaleEmail(
  sellerEmail: string,
  sellerName: string,
  order: OrderWithItems
): Promise<void> {
  const sellerItems = order.order_items.filter(
    (item) => item.seller_id === order.order_items[0]?.seller_id
  );
  const sellerEarnings = sellerItems.reduce(
    (sum, item) => sum + item.seller_earnings,
    0
  );

  const content = `
    <h1>You Made a Sale! 💎</h1>
    <p>Hello ${sellerName},</p>
    <p>Great news! You have a new order to fulfill. Here are the details:</p>
    
    <h2>Order #${order.id.slice(0, 8).toUpperCase()}</h2>
    ${sellerItems
      .map(
        (item) => `
      <div class="order-item">
        <strong style="color: #e8e0d5">${item.products?.name ?? 'Gemstone'}</strong> 
        — Qty: ${item.quantity}
      </div>
    `
      )
      .join('')}
    
    <hr class="divider" />
    <table>
      <tr><td>Your Earnings</td><td><strong class="highlight">$${sellerEarnings.toFixed(2)}</strong></td></tr>
    </table>
    
    <center>
      <a href="${BASE_URL}/seller/orders" class="btn">VIEW ORDER</a>
    </center>
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: sellerEmail,
    subject: `New Sale — $${sellerEarnings.toFixed(2)} Earned on GemVault`,
    html: baseTemplate(content),
  });
}

export async function sendShipmentEmail(
  buyerEmail: string,
  buyerName: string,
  orderId: string,
  trackingNumber: string,
  carrier: string
): Promise<void> {
  const content = `
    <h1>Your Order Has Shipped! 📦</h1>
    <p>Hello ${buyerName},</p>
    <p>Your gemstone is on its way! Here are your tracking details:</p>
    
    <div style="background: #1a1a2a; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0;"><strong style="color: #c9a96e">Carrier:</strong> <span style="color: #e8e0d5">${carrier}</span></p>
      <p style="margin: 8px 0 0;"><strong style="color: #c9a96e">Tracking Number:</strong> <span style="color: #e8e0d5">${trackingNumber}</span></p>
    </div>
    
    <center>
      <a href="${BASE_URL}/buyer/orders/${orderId}" class="btn">TRACK SHIPMENT</a>
    </center>
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: buyerEmail,
    subject: `Your GemVault Order Has Shipped — ${trackingNumber}`,
    html: baseTemplate(content),
  });
}

export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
): Promise<void> {
  const content = `
    <h1>Reset Your Password</h1>
    <p>We received a request to reset your GemVault password.</p>
    <p>Click the button below to create a new password. This link will expire in 1 hour.</p>
    
    <center>
      <a href="${resetLink}" class="btn">RESET PASSWORD</a>
    </center>
    
    <p style="font-size: 13px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Reset Your GemVault Password',
    html: baseTemplate(content),
  });
}

export async function sendWelcomeEmail(
  email: string,
  name: string,
  role: 'buyer' | 'seller'
): Promise<void> {
  const sellerContent =
    role === 'seller'
      ? `<p>Your seller account is pending verification. We'll review your application and notify you within 24 hours.</p>`
      : `<p>Start browsing our curated collection of certified gemstones from verified sellers worldwide.</p>`;

  const content = `
    <h1>Welcome to GemVault ✦</h1>
    <p>Hello ${name},</p>
    <p>Your account has been created successfully. Welcome to the premier gemstone marketplace.</p>
    ${sellerContent}
    
    <center>
      <a href="${BASE_URL}/marketplace" class="btn">EXPLORE GEMSTONES</a>
    </center>
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Welcome to GemVault — Your Gemstone Marketplace',
    html: baseTemplate(content),
  });
}

export async function sendLowStockAlert(
  sellerEmail: string,
  productName: string,
  stockRemaining: number,
  productId: string
): Promise<void> {
  const content = `
    <h1>Low Stock Alert ⚠️</h1>
    <p>Your listing <strong style="color: #c9a96e">${productName}</strong> is running low on stock.</p>
    
    <div style="background: #1a1a2a; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
      <div style="font-size: 48px; color: #e53e3e; font-weight: bold;">${stockRemaining}</div>
      <div style="color: #8a8a9a;">units remaining</div>
    </div>
    
    <center>
      <a href="${BASE_URL}/seller/listings/${productId}/edit" class="btn">UPDATE STOCK</a>
    </center>
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: sellerEmail,
    subject: `Low Stock Alert: ${productName} — ${stockRemaining} left`,
    html: baseTemplate(content),
  });
}

export async function sendPayoutEmail(
  sellerEmail: string,
  sellerName: string,
  amount: number,
  payoutId: string
): Promise<void> {
  const content = `
    <h1>Payout Processed 💰</h1>
    <p>Hello ${sellerName},</p>
    <p>Your payout has been successfully processed.</p>
    
    <div style="background: #1a1a2a; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
      <div style="font-size: 48px; color: #c9a96e; font-weight: bold;">$${amount.toFixed(2)}</div>
      <div style="color: #8a8a9a;">transferred to your bank account</div>
    </div>
    
    <p style="text-align: center; color: #8a8a9a; font-size: 13px;">Payout ID: ${payoutId}</p>
    
    <center>
      <a href="${BASE_URL}/seller/payouts" class="btn">VIEW PAYOUTS</a>
    </center>
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: sellerEmail,
    subject: `Payout of $${amount.toFixed(2)} Sent — GemVault`,
    html: baseTemplate(content),
  });
}
