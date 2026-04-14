import Link from 'next/link';

const FOOTER_LINKS = {
  Marketplace: [
    { label: 'Browse All Gems', href: '/marketplace' },
    { label: 'Certified Gems', href: '/marketplace?is_certified=true' },
    { label: 'New Arrivals', href: '/marketplace?sort_by=newest' },
    { label: 'Featured', href: '/marketplace?is_featured=true' },
  ],
  Gemstones: [
    { label: 'Rubies', href: '/marketplace?gemstone_type=Ruby' },
    { label: 'Sapphires', href: '/marketplace?gemstone_type=Sapphire' },
    { label: 'Emeralds', href: '/marketplace?gemstone_type=Emerald' },
    { label: 'Diamonds', href: '/marketplace?gemstone_type=Diamond' },
    { label: 'All Types', href: '/marketplace' },
  ],
  Sellers: [
    { label: 'Sell on GemVault', href: '/register?role=seller' },
    { label: 'Seller Dashboard', href: '/seller' },
    { label: 'Stripe Payments', href: '/seller/settings' },
    { label: 'Seller FAQ', href: '/faq#sellers' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-obsidian border-t border-obsidian-border mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        {/* Top */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="text-gold font-serif text-xl tracking-[0.2em] font-semibold">
                ✦ GEMVAULT
              </span>
            </Link>
            <p className="text-sm text-ivory-subtle leading-relaxed mb-6">
              The premier marketplace for certified precious and semi-precious gemstones.
              Connecting discerning buyers with verified sellers worldwide.
            </p>
            <div className="flex items-center gap-3">
              {/* Social links */}
              {[
                { label: 'X', href: 'https://twitter.com' },
                { label: 'IG', href: 'https://instagram.com' },
                { label: 'FB', href: 'https://facebook.com' },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-obsidian-light border border-obsidian-border flex items-center justify-center text-xs text-ivory-muted hover:text-gold hover:border-gold/40 transition-colors"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold text-ivory uppercase tracking-widest mb-4">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ivory-subtle hover:text-gold transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 py-8 border-y border-obsidian-border mb-8">
          {[
            { icon: '🔒', label: 'Secure Payments', sub: 'Stripe Protected' },
            { icon: '✓', label: 'Verified Sellers', sub: 'ID Verified' },
            { icon: '💎', label: 'Certified Gems', sub: 'GIA / IGI' },
            { icon: '↩️', label: 'Easy Returns', sub: '14-Day Policy' },
            { icon: '🌍', label: 'Global Shipping', sub: 'Worldwide' },
          ].map((badge) => (
            <div key={badge.label} className="flex items-center gap-2.5 text-center">
              <span className="text-xl">{badge.icon}</span>
              <div>
                <p className="text-xs font-semibold text-ivory">{badge.label}</p>
                <p className="text-xs text-ivory-subtle">{badge.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ivory-subtle">
            © {new Date().getFullYear()} GemVault, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' },
              { label: 'Cookie Policy', href: '/cookies' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-ivory-subtle hover:text-gold transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
