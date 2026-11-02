interface RankBadgeProps {
  rank: number;
}

export default function RankBadge({ rank }: RankBadgeProps) {
  const isTop = rank === 1;
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-base font-bold ${
        isTop
          ? 'bg-neon text-ink-950 ring-2 ring-neon'
          : 'border-2 border-white/30 bg-ink-900 text-paper'
      }`}
    >
      {rank}
    </span>
  );
}
