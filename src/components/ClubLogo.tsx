const CLUB_LOGO_SRC = '/assets/WhatsApp_Image_2026-11-02_at_10.44.48.jpeg';

interface ClubLogoProps {
  className?: string;
}

export default function ClubLogo({ className = '' }: ClubLogoProps) {
  return (
    <div className={`relative aspect-square overflow-hidden rounded-full ${className}`}>
      <img
        src={CLUB_LOGO_SRC}
        alt="Logo PATC Tennis Club"
        draggable={false}
        className="absolute max-w-none select-none"
        style={{ width: '102%', height: '220.8%', left: '-1.1%', top: '-60.8%' }}
      />
    </div>
  );
}
