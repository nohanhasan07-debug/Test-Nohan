interface RankBadgeProps {
  rank: number;
}

export default function RankBadge({ rank }: RankBadgeProps) {
  const isTop = rank === 1;
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-base font-bold ${
        isTop
          ? 'bg-maroon text-gold ring-2 ring-gold'
          : 'border-2 border-maroon/40 bg-cream text-maroon'
      }`}
    >
      {rank}
    </span>
  );
}
