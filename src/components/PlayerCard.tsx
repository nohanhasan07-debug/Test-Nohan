import React, { forwardRef } from 'react';
import { Player } from '../types/playerCard';

interface PlayerCardProps {
  player: Player;
  matchesCount: number;
  winRate: number;
  isPOTM?: boolean;
  onEditPhoto?: () => void;
  isAdmin?: boolean;
  className?: string;
}

export const PlayerCard = forwardRef<HTMLDivElement, PlayerCardProps>(
  ({ player, matchesCount, winRate, isPOTM = false, onEditPhoto, isAdmin = false, className = '' }, ref) => {
    // Normalisasi Win Rate agar dibulatkan 1 desimal
    const formattedWinRate = (isNaN(winRate) ? 0 : winRate).toFixed(1);

    return (
      <div
        ref={ref}
        className={`relative aspect-[3/4] w-full rounded-3xl bg-[#0F0402] border border-white/15 overflow-hidden shadow-2xl select-none group transition-all duration-300 ${
          isPOTM ? 'shadow-[0_0_35px_rgba(255,122,69,0.35)] border-[#FF7A45]/50' : 'hover:border-white/30'
        } ${className}`}
      >
        {/* --- 1. AREA FOTO PORTRAIT (70% ATAS) --- */}
        <div className="absolute inset-0 w-full h-full bg-[#0F0402]">
          {player.photo_url ? (
            <img
              src={player.photo_url}
              alt={player.name}
              crossOrigin="anonymous"
              className="w-full h-[72%] object-cover object-top grayscale contrast-125 brightness-95 group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-[72%] flex flex-col items-center justify-center bg-gradient-to-b from-[#1A0804] to-[#0F0402] opacity-80">
              <svg
                className="w-20 h-20 text-white/20 mb-2"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              <span className="text-[10px] tracking-widest uppercase font-mono text-white/30">NO PORTRAIT</span>
            </div>
          )}
        </div>

        {/* --- 2. GRADIENT OVERLAY HITAM TIPIS & TRANSISI BAWAH --- */}
        {/* Gradient atas untuk memperjelas logo PATC */}
        <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none" />
        
        {/* Gradient bawah yang memisahkan area foto dengan panel teks */}
        <div className="absolute bottom-0 inset-x-0 h-[45%] bg-gradient-to-t from-[#0F0402] via-[#0F0402]/95 to-transparent pointer-events-none" />

        {/* --- 3. HEADER OVERLAY: LOGO PATC & BADGE POTM --- */}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-md">
            <div className="w-2 h-2 rounded-full bg-[#FF7A45] animate-pulse" />
            <span className="font-serif font-black tracking-wider text-xs text-[#FDF8F5]">PATC</span>
            <span className="text-[8px] font-mono tracking-widest text-[#FF7A45] uppercase">CLUB</span>
          </div>

          {isPOTM && (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-[#FF7A45] to-[#B84013] text-white px-3 py-1 rounded-full shadow-lg border border-amber-300/40 animate-bounce duration-1000">
              <span className="text-xs">👑</span>
              <span className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase text-white drop-shadow">
                POTM
              </span>
            </div>
          )}
        </div>

        {/* --- 4. BUTTON EDIT ADMIN --- */}
        {isAdmin && onEditPhoto && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditPhoto();
            }}
            className="absolute top-4 right-4 z-20 bg-black/70 hover:bg-[#B84013] text-white p-2 rounded-full backdrop-blur-md border border-white/20 transition-all opacity-0 group-hover:opacity-100 shadow-lg"
            title="Ubah Foto Pemain"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}

        {/* --- 5. PANEL BAWAH: NAMA, DIVIDER & STATISTIK (DILUAR AREA WAJAH) --- */}
        <div className="absolute bottom-3 inset-x-3.5 z-10 flex flex-col">
          {/* Nama Pemain */}
          <div className="mb-1">
            <h3 className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-wider text-[#FDF8F5] truncate drop-shadow-md">
              {player.name}
            </h3>
          </div>

          {/* Garis Divider Terakota */}
          <div className="h-[1.5px] w-full bg-gradient-to-r from-[#FF7A45] via-white/30 to-transparent mb-2" />

          {/* Box Statistik Ganda */}
          <div className="grid grid-cols-2 gap-2">
            {/* MATCHES */}
            <div className="flex flex-col items-center justify-center bg-[#1A0804]/90 backdrop-blur-md rounded-2xl py-2 border border-white/10 shadow-inner">
              <span className="text-base sm:text-lg font-black text-white leading-tight">
                {matchesCount}
              </span>
              <span className="bg-[#B84013] text-[#FDF8F5] text-[8px] sm:text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mt-0.5 shadow-sm">
                MATCHES
              </span>
            </div>

            {/* WINRATE */}
            <div className="flex flex-col items-center justify-center bg-[#1A0804]/90 backdrop-blur-md rounded-2xl py-2 border border-white/10 shadow-inner">
              <span className="text-base sm:text-lg font-black text-[#FF7A45] leading-tight">
                {formattedWinRate}%
              </span>
              <span className="bg-[#B84013] text-[#FDF8F5] text-[8px] sm:text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mt-0.5 shadow-sm">
                WINRATE
              </span>
            </div>
          </div>

          {/* Social Handle */}
          <div className="text-center mt-2.5">
            <span className="text-[9px] sm:text-[10px] text-white/50 tracking-[0.25em] uppercase font-mono">
              @patctennis
            </span>
          </div>
        </div>
      </div>
    );
  }
);

PlayerCard.displayName = 'PlayerCard';
