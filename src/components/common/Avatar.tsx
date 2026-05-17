import Image from 'next/image';
import { cn, getAvatarUrl } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  username?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  ring?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizes = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
};

const pxSizes = { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 };

export function Avatar({ src, username, size = 'md', ring, className, onClick }: AvatarProps) {
  const url = getAvatarUrl(src, username);
  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden flex-shrink-0 bg-[#1a1a1a]',
        sizes[size],
        ring && 'ring-2 ring-gold/70 ring-offset-1 ring-offset-obsidian',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <Image
        src={url}
        alt={username || 'Avatar'}
        fill
        sizes={`${pxSizes[size]}px`}
        className="object-cover"
        unoptimized
      />
    </div>
  );
}
