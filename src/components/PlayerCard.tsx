import React, { forwardRef } from 'react';
import { Camera } from 'lucide-react';
import { Player } from '../types/playerCard';

interface PlayerCardProps {
  player: Player;
  matchesCount: number;
  winRate: number;
  isPOTM?: boolean;
  onEditPhoto?: () => void;
  onClick?: () => void;
  isAdmin?: boolean;
  isOwner?: boolean; // True jika kartu ini milik akun yang sedang login
  className?: string;
}

export const PlayerCard = forwardRef<HTMLDivElement, PlayerCardProps>(
  (
    {
      player,
      matchesCount,
      winRate,
      isPOTM = false,
      onEditPhoto,
      onClick,
      isAdmin = false,
      isOwner = false,
      className = '',
    },
    ref
  ) => {
    const formattedWinRate = (isNaN(winRate) ? 0 : winRate).toFixed(1);

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={`relative aspect-[3/4] w-full rounded-3xl bg-[#0F0402] border border-white/15 overflow-hidden shadow-2xl select-none group transition-all duration-300 ${
          onClick ? 'cursor-pointer hover:scale-[1.03] active:scale-95' : ''
        } ${
          isPOTM
            ? 'shadow-[0_0_35px_rgba(255,122,69,0.45)] border-[#FF7A45]'
            : isOwner
            ? 'border-[#FF7A45]/50 shadow-[0_0_20px_rgba(255,122,69,0.2)]'
            : 'hover:border-[#FF7A45]/60 hover:shadow-[0_0_25px_rgba(255,122,69,0.25)]'
        } ${className}`}
      >
        {/* 1. AREA FOTO PORTRAIT */}
        <div className="absolute inset-0 w-full h-full bg-[#0F0402]">
          {player.photo_url ? (
            <img
              src={player.photo_url}
              alt={player.name}
              crossOrigin="anonymous"
              className="w-full h-[72%] object-cover object-top grayscale contrast-125 brightness-95 group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-[72%] flex flex-col items-center justify-center bg-gradient-to-b from-[#1F0803] to-[#0F0402]">
              <svg
                className="w-16 h-16 sm:w-20 sm:h-20 text-[#FF7A45]/30 mb-2"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              <span style={{ color: 'rgba(255, 122, 69, 0.4)' }} className="text-[9px] tracking-widest uppercase font-mono font-bold">
                NO PORTRAIT
              </span>
            </div>
          )}
        </div>

        {/* 2. GRADIENT OVERLAY */}
        <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-[50%] bg-gradient-to-t from-[#0F0402] via-[#0F0402]/95 to-transparent pointer-events-none" />

        {/* 3. HEADER OVERLAY: LOGO & BADGE */}
        <div className="absolute top-3 sm:top-4 inset-x-3 sm:inset-x-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 shadow-md">
            <div className="w-2 h-2 rounded-full bg-[#FF7A45] animate-pulse" />
            <span style={{ color: '#FFFFFF' }} className="font-serif font-black tracking-wider text-[11px]">PATC</span>
            <span style={{ color: '#FF7A45' }} className="text-[8px] font-mono tracking-widest uppercase font-bold">CLUB</span>
          </div>

          <div className="flex items-center gap-1.5">
            {isOwner && !isPOTM && (
              <span style={{ backgroundColor: '#FF7A45', color: '#0F0402' }} className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow">
                YOU
              </span>
            )}

            {isPOTM && (
              <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 via-[#FF7A45] to-[#B84013] text-white px-2.5 py-1 rounded-full shadow-lg border border-amber-300/40 animate-bounce duration-1000">
                <span className="text-xs">👑</span>
                <span className="text-[9px] sm:text-[10px] font-black tracking-widest uppercase text-white drop-shadow">
                  POTM
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 4. TOMBOL UPLOAD FOTO (BISA DIAKSES OLEH PEMILIK AKUN & MASTER ADMIN) */}
        {(isAdmin || isOwner) && onEditPhoto && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditPhoto();
            }}
            style={{
              backgroundColor: isOwner ? '#FF7A45' : 'rgba(15, 4, 2, 0.85)',
              borderColor: '#FF7A45',
              color: isOwner ? '#0F0402' : '#FF7A45',
            }}
            className="absolute top-12 right-3 sm:right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full border shadow-xl transition-all hover:scale-110 active:scale-95"
            title={isOwner ? 'Ganti Foto Profil Anda' : 'Ubah Foto Pemain'}
          >
            <Camera className="h-4 w-4" />
          </button>
        )}

        {/* 5. PANEL BAWAH: NAMA & STATISTIK */}
        <div className="absolute bottom-3 inset-x-3 sm:inset-x-3.5 z-10 flex flex-col">
          <div className="mb-1">
            <h3 style={{ color: '#FFFFFF' }} className="text-base sm:text-lg md:text-xl font-black uppercase tracking-wider truncate drop-shadow-md">
              {player.name}
            </h3>
          </div>

          <div className="h-[1.5px] w-full bg-gradient-to-r from-[#FF7A45] via-white/30 to-transparent mb-2" />

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col items-center justify-center bg-[#1A0804]/90 backdrop-blur-md rounded-2xl py-2 border border-white/10 shadow-inner">
              <span style={{ color: '#FFFFFF' }} className="text-base sm:text-lg font-black leading-tight">
                {matchesCount}
              </span>
              <span style={{ backgroundColor: '#B84013', color: '#FFFFFF' }} className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mt-0.5 shadow-sm">
                MATCHES
              </span>
            </div>

            <div className="flex flex-col items-center justify-center bg-[#1A0804]/90 backdrop-blur-md rounded-2xl py-2 border border-white/10 shadow-inner">
              <span style={{ color: '#FF7A45' }} className="text-base sm:text-lg font-black leading-tight">
                {formattedWinRate}%
              </span>
              <span style={{ backgroundColor: '#B84013', color: '#FFFFFF' }} className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mt-0.5 shadow-sm">
                WINRATE
              </span>
            </div>
          </div>

          <div className="text-center mt-2">
            <span style={{ color: 'rgba(255, 255, 255, 0.4)' }} className="text-[8px] sm:text-[9px] tracking-[0.25em] uppercase font-mono font-medium">
              @patctennis
            </span>
          </div>
        </div>
      </div>
    );
  }
);

PlayerCard.displayName = 'PlayerCard';
