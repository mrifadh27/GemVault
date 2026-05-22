'use client';

import { useState } from 'react';
import { BookOpen, Search, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const ARTICLES = [
  {
    id: 'unheated-sapphire',
    category: 'Treatment Guide',
    title: 'Unheated vs Heated Sapphires',
    icon: '🔵',
    summary: 'Heat treatment is the most common enhancement for sapphires. Learn how to identify it and why unheated stones command significant premiums.',
    content: `Heat treatment improves color and clarity in sapphires by dissolving rutile silk inclusions and improving color distribution. It has been practiced since antiquity and is widely accepted in the trade.\n\n**How to identify:** Laboratory testing (GRS, GIA, Gübelin) can detect heat treatment with high certainty. Treated stones may show changes in inclusion morphology, healed fractures, and altered silk.\n\n**Price premium:** Unheated, certified sapphires — particularly from Kashmir, Burma, and Ceylon — can command 2–10× the price of equivalent heated stones. A fine 3ct unheated Kashmir sapphire can reach $30,000–$100,000+/ct at auction.\n\n**Certification:** Always insist on a major lab report (GRS, Gübelin, SSEF, Lotus) for sapphires above 2ct claiming to be unheated. These labs are unanimous in their ability to detect heat treatment.`,
    tags: ['Sapphire', 'Treatment', 'Certification'],
    labLinks: [{ name: 'GRS cert lookup', url: 'https://www.gemresearch.ch/report-check/' }, { name: 'Gübelin', url: 'https://grs.gemresearch.ch/' }],
  },
  {
    id: 'mogok-origin',
    category: 'Origin Guide',
    title: 'Mogok Valley Rubies',
    icon: '🔴',
    summary: 'Mogok in Myanmar produces the finest rubies in the world. The famous "pigeon blood" color, fluorescence, and silk inclusions make them unmistakable.',
    content: `The Mogok Stone Tract in central Myanmar (Burma) has been the source of the world's finest rubies for over 1,000 years. The geology — calcium-rich marbles — imparts a unique purity of red color with very low iron content.\n\n**Pigeon Blood:** This is GRS's top color designation for Mogok rubies, describing a pure, vivid red with a touch of blue. It commands a massive premium over other reds.\n\n**Fluorescence:** Mogok rubies fluoresce strongly under UV light (and even in daylight), adding an inner glow that makes them appear to light up from within.\n\n**Key inclusions:** Rutile silk needles, fingerprints, negative crystals, and calcite are typical Mogok inclusions. Paradoxically, silk inclusions increase value by confirming natural, unheated status.\n\n**Market:** Fine, GRS or Gübelin-certified unheated Mogok rubies above 3ct can sell for $50,000–$500,000+/ct at major auction houses.`,
    tags: ['Ruby', 'Origin', 'Myanmar'],
    labLinks: [{ name: 'GRS', url: 'https://www.gemresearch.ch' }, { name: 'Gübelin', url: 'https://www.gubelingemlab.com' }],
  },
  {
    id: 'alexandrite-phenomenon',
    category: 'Gem Phenomena',
    title: 'Alexandrite Color Change',
    icon: '🟣',
    summary: 'True alexandrite changes from green in daylight to red under incandescent light. The stronger the color change, the more valuable the stone.',
    content: `Alexandrite is a variety of chrysoberyl containing chromium, which causes it to absorb light in a way that makes it appear green-blue in daylight (high UV) and red-purple in incandescent light (low UV).\n\n**Quality factors:** The primary value factor is the strength and quality of the color change. "Fine" change = green and red (not brownish). A strong change from 100% green to 100% red is rare and extremely valuable.\n\n**Origins matter:** The finest alexandrites come from Russia (Ural Mountains) and are extremely rare. Brazilian alexandrites are more available but can show excellent change. Sri Lankan and Indian stones are more common with weaker change.\n\n**Video is essential:** For any alexandrite listing, always provide a video showing both daylight and incandescent light to demonstrate the color change. Static photos cannot capture the phenomenon.\n\n**Certification:** GRS, Gübelin, or Gemia for Russian alexandrites. Lab report should state origin and color-change percentage.`,
    tags: ['Alexandrite', 'Phenomenon', 'Color Change'],
    labLinks: [],
  },
  {
    id: 'cert-comparison',
    category: 'Certification',
    title: 'Major Lab Comparison: GIA vs GRS vs Gübelin',
    icon: '📋',
    summary: 'Each major gem lab has different strengths. Understand which lab report to trust for which gem type and origin.',
    content: `**GIA (Gemological Institute of America)**\nBest for: Diamonds (undisputed standard), colored stones. Their colored stone reports are respected but less detailed on origin than Swiss labs. Accessible and widely trusted by buyers new to the trade.\n\n**GRS (Gem Research Swisslab)**\nBest for: Colored stones with origin claims, especially Kashmir sapphires, Mogok rubies, Colombian emeralds. Known for their proprietary "Pigeon Blood," "Royal Blue," and "Vivid Green" designations that command premiums. Very detailed treatment detection.\n\n**Gübelin Gem Lab**\nBest for: High-value rubies and sapphires, especially those where provenance matters for auction. Their reports include photomicrographs and detailed inclusion documentation. Swiss labs (Gübelin, GRS, SSEF) are the gold standard for Burma and Kashmir origin claims.\n\n**Lotus Gemology**\nBest for: Budget-conscious buyers, Southeast Asian gems. Technically rigorous, transparent about methodology, less expensive than Swiss labs.\n\n**For GemGram sellers:** Always include the lab and report number in your listing. High-value stones (>5ct, >$10k) should have Swiss lab certification to command best prices.`,
    tags: ['Certification', 'GIA', 'GRS', 'Gübelin'],
    labLinks: [
      { name: 'GIA report check', url: 'https://www.gia.edu/report-check' },
      { name: 'GRS report check', url: 'https://www.gemresearch.ch/report-check/' },
      { name: 'Gübelin report check', url: 'https://report.gubelingemlab.com/' },
      { name: 'Lotus report check', url: 'https://www.lotusgemology.com/index.php/services/report-check' },
    ],
  },
  {
    id: 'opal-types',
    category: 'Gem Guide',
    title: 'Understanding Opal Types',
    icon: '🌈',
    summary: 'Black opal, crystal opal, boulder opal — each type has a unique play-of-color. Learn the key quality factors and top origins.',
    content: `Opal's value is determined primarily by its "play-of-color" — the spectral flashes of color caused by light diffraction through silica spheres.\n\n**Types:**\n• Black opal: Dark body tone (N1–N4) makes colors pop. Lightning Ridge, NSW, Australia. Most valuable.\n• Crystal opal: Transparent to translucent, superb color visible from any angle. High value.\n• White/Light opal: Pale body, less dramatic but widely available. Coober Pedy, SA, Australia.\n• Boulder opal: Ironstone host material creates unique patterns. Queensland, Australia.\n• Ethiopian/Welo opal: Hydrophane opals that absorb water, sometimes changing play. Affordable.\n\n**Quality factors:** Color range (red is rarest, blue/green common), pattern (harlequin is most valuable), brilliance, and body tone.\n\n**For listings:** Video is essential for opals — post multiple videos in different lighting to show the full play-of-color range. A static photo captures maybe 20% of an opal's beauty.`,
    tags: ['Opal', 'Australia', 'Play-of-Color'],
    labLinks: [],
  },
  {
    id: 'emerald-treatments',
    category: 'Treatment Guide',
    title: 'Emerald Oil & Resin Treatments',
    icon: '💚',
    summary: 'Almost all emeralds are oiled or resin-filled to improve clarity. Learn the grading scale, what "F1/F2/F3" means, and how it affects value.',
    content: `Emeralds are almost universally included — they rarely form without fractures. "Jardin" (garden) refers to the characteristic inclusions. Oil or resin filling of surface-reaching fractures is traditional and widely accepted.\n\n**GRS/Gübelin Grading:**\n• F1 (Insignificant): Essentially no filling. Very rare, commands premium.\n• F2 (Minor): Light oiling. Standard for fine emeralds.\n• F3 (Moderate): Moderate filling. Acceptable at lower price points.\n• F4/F5 (Significant/Extensive): Heavily treated. Significantly lower value, requires disclosure.\n\n**Resin vs Oil:** Cedar oil is traditional and accepted. Modern resin fillings (Opticon, epoxy) are more stable but less accepted. GRS and GIA will grade both but note the filler type.\n\n**Colombia vs Zambia:** Colombian emeralds (Muzo, Chivor, Coscuez) command the highest premiums for fine quality. Zambian emeralds have excellent saturation and bluish hue. Lab certification stating Colombian origin adds 30–100% premium over other origins at equivalent quality.`,
    tags: ['Emerald', 'Treatment', 'Colombia', 'Zambia'],
    labLinks: [],
  },
  {
    id: 'gia-color-grading',
    category: 'Grading Guide',
    title: 'GIA Color Grading for Colored Stones',
    icon: '🎨',
    summary: 'The GIA system uses three dimensions: Hue, Tone, and Saturation. Understanding this allows precise color communication and fair pricing.',
    content: `Unlike diamonds, colored stone color grading uses three independent components:\n\n**Hue:** The primary color. Pure hues (Red, Blue, Green) are more valuable than modifying hues (Orangy Red, Violetish Blue). Ruby = Red; if more than 10% orange modifier → "Orangy Red" → not ruby pricing.\n\n**Tone:** Lightness to darkness on a scale of 1 (lightest) to 9 (darkest). Ideal ranges: Ruby 6–7, Sapphire 5–7, Emerald 5–6. Too light = washed out. Too dark = looks black.\n\n**Saturation:** From grayish (1) to vivid (6). The highest quality designation is "Vivid" — pure, strong hue with no gray or brown modifier. GRS uses proprietary terms: "Pigeon Blood" ruby = Red/Slightly purplish Red, Vivid, 6–7 tone.\n\n**GemGram color picker:** Use the color grading fields on your listing to make your gem searchable by buyers who know exactly what they're looking for.`,
    tags: ['Color Grading', 'GIA', 'Hue', 'Saturation'],
    labLinks: [],
  },
  {
    id: 'spinel-vs-ruby',
    category: 'Gem Guide',
    title: 'Spinel: The Misidentified Gem',
    icon: '🟥',
    summary: 'Spinel was confused with ruby for centuries. Today it\'s prized in its own right. Fine red and hot pink spinels now rival rubies in value.',
    content: `Many famous "rubies" in royal collections are actually spinels — including the "Black Prince's Ruby" in the British Imperial Crown. The confusion persisted until the 19th century when mineralogy distinguished them.\n\n**Why spinel is valuable now:**\n• Typically unheated (heat treatment does nothing for spinel), so certified stones are almost always natural.\n• High refractive index gives exceptional brilliance.\n• Available in vivid colors not found in other gems: neon pink, traffic-light red, cobalt blue (extremely rare).\n\n**Top origins:** Burma (Mogok) and Tajikistan for reds and pinks; Sri Lanka for blues. Mahenge, Tanzania for neon pink.\n\n**Market:** Fine Mahenge hot pink spinels above 5ct can reach $10,000–$30,000+/ct. Cobalt blue spinels from Sri Lanka are among the rarest gems.\n\n**Identification:** Spinel is singly refractive (unlike corundum which is doubly refractive). Labs can easily distinguish spinel from ruby.`,
    tags: ['Spinel', 'Ruby', 'Myanmar', 'Treatment'],
    labLinks: [],
  },
];

const CATEGORIES = ['All', 'Treatment Guide', 'Origin Guide', 'Certification', 'Gem Guide', 'Gem Phenomena', 'Grading Guide'];

interface ArticleCardProps { article: typeof ARTICLES[0]; }

function ArticleCard({ article }: ArticleCardProps) {
  const [open, setOpen] = useState(false);
  const paragraphs = article.content.split('\n\n').filter(Boolean);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        <span className="text-2xl flex-shrink-0">{article.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-gold uppercase tracking-wider">{article.category}</span>
          </div>
          <h3 className="text-sm font-semibold text-ivory mb-1">{article.title}</h3>
          <p className="text-xs text-ivory-muted line-clamp-2">{article.summary}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {article.tags.map(t => (
              <span key={t} className="text-[10px] text-ivory-subtle border border-[#222] px-1.5 py-0.5 rounded">{t}</span>
            ))}
          </div>
        </div>
        <div className="flex-shrink-0 mt-1">
          {open ? <ChevronUp className="w-4 h-4 text-ivory-muted" /> : <ChevronDown className="w-4 h-4 text-ivory-muted" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[#1e1e1e] pt-4 space-y-3">
          {paragraphs.map((para, i) => {
            // Bold **text**
            const rendered = para.replace(/\*\*(.+?)\*\*/g, '<strong class="text-ivory font-semibold">$1</strong>');
            return (
              <p key={i} className="text-sm text-ivory-muted leading-relaxed" dangerouslySetInnerHTML={{ __html: rendered }} />
            );
          })}

          {article.labLinks.length > 0 && (
            <div className="pt-2 border-t border-[#1e1e1e]">
              <p className="text-xs text-ivory-subtle mb-2">Verify certificates:</p>
              <div className="flex flex-wrap gap-2">
                {article.labLinks.map(link => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-gold hover:text-gold/80 transition-colors"
                  >
                    {link.name} <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function KnowledgeHub() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = ARTICLES.filter(a => {
    const matchCat = category === 'All' || a.category === category;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.tags.some(t => t.toLowerCase().includes(search.toLowerCase())) || a.summary.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-gold" />
        <h1 className="font-bold text-ivory">Gem Knowledge Hub</h1>
      </div>
      <p className="text-xs text-ivory-muted">
        Expert guides on gemstone treatments, origins, certification, and grading. Tap any article to expand.
      </p>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#444]" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search topics, gems…" className="input pl-8" />
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-all flex-shrink-0',
              category === c
                ? 'bg-gold text-obsidian border-gold font-semibold'
                : 'border-[#2a2a2a] text-ivory-muted hover:border-gold/40',
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-ivory-muted py-8">No articles match your search</p>
        ) : (
          filtered.map(a => <ArticleCard key={a.id} article={a} />)
        )}
      </div>
    </div>
  );
}
