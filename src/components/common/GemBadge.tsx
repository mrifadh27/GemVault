import { cn, getGemstoneColor } from '@/lib/utils';

interface GemBadgeProps {
  type: string;
  size?: 'sm' | 'md';
  className?: string;
}

const gemEmojis: Record<string, string> = {
  Ruby: '🔴', Sapphire: '🔵', Emerald: '💚', Diamond: '🤍',
  Amethyst: '🟣', Opal: '🌈', Garnet: '🍷', Topaz: '🟡',
  Aquamarine: '🩵', Tourmaline: '🎨', Tanzanite: '💜', Spinel: '🌸',
  Alexandrite: '🟢', Morganite: '🌷', Peridot: '💛', Citrine: '🌕',
  Zircon: '💠', Other: '✨',
};

export function GemBadge({ type, size = 'md', className }: GemBadgeProps) {
  const color = getGemstoneColor(type);
  const emoji = gemEmojis[type] ?? '💎';
  return (
    <span
      className={cn('gem-badge', size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1', className)}
      style={{ backgroundColor: `${color}18`, color, borderColor: `${color}40`, border: '1px solid' }}
    >
      <span>{emoji}</span>
      {type}
    </span>
  );
}

export function CategoryBadge({ slug, name, icon, color, active, onClick }: {
  slug: string; name: string; icon: string; color: string;
  active?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn('cat-tab', active ? 'cat-tab-active' : 'cat-tab-inactive')}
      style={active ? {} : { '--hover-color': color } as React.CSSProperties}
    >
      <span>{icon}</span>
      <span>{name}</span>
    </button>
  );
}
