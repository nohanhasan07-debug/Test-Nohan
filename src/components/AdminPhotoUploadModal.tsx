import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase'; // Pastikan path supabase client sesuai
import { Player } from '../types/playerCard';
import { PlayerCard } from './PlayerCard';

interface AdminPhotoUploadModalProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedPlayer: Player) => void;
}

export const AdminPhotoUploadModal: React.FC<AdminPhotoUploadModalProps> = ({
  player,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(player.photo_url || null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Pemilihan File Gambar
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validasi tipe file
      if (!file.type.startsWith('image/')) {
        setErrorMessage('File harus berupa gambar (JPG, PNG, atau WEBP).');
        return;
      }

      // Validasi ukuran (Maksimal 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Ukuran file maksimal 5MB.');
        return;
      }

      setErrorMessage(null);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Upload ke Supabase Storage Bucket 'player-photos'
  const handleSavePhoto = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setErrorMessage(null);

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${player.id}-${Date.now()}.${fileExt}`;
      const filePath = `portraits/${fileName}`;

      // 1. Upload ke Storage
      const { error: uploadError } = await supabase.storage
        .from('player-photos')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 2. Ambil Public URL
      const { data: publicUrlData } = supabase.storage
        .from('player-photos')
        .getPublicUrl(filePath);

      const newPhotoUrl = publicUrlData.publicUrl;

      // 3. Update Kolom Database Profiles / Players
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ photo_url: newPhotoUrl })
        .eq('id', player.id);

      if (dbError) throw dbError;

      // 4. Callback sukses
      onSuccess({
        ...player,
        photo_url: newPhotoUrl,
      });

      onClose();
    } catch (err: any) {
      console.error('Upload error:', err);
      setErrorMessage(err.message || 'Gagal mengunggah foto. Pastikan hak akses Storage benar.');
    } finally {
      setIsUploading(false);
    }
  };

  // Mock player object untuk live preview
  const previewPlayer: Player = {
    ...player,
    photo_url: previewUrl,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0F0402] border border-white/15 rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-[#FF5500]/20 rounded-full blur-[90px] pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold text-[#FDF8F5] tracking-wide flex items-center gap-2">
              <span className="text-[#FF7A45]">⚡</span> UPDATE PLAYER PORTRAIT
            </h3>
            <p className="text-xs text-white/60">Master Admin Control Panel</p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-white/60 hover:text-white p-1 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body: Live Preview & File Input */}
        <div className="mt-5 space-y-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#FF7A45]">
            LIVE CARD PREVIEW
          </div>

          {/* Container Preview 1:1 Card */}
          <div className="max-w-[260px] mx-auto">
            <PlayerCard
              player={previewPlayer}
              matchesCount={12}
              winRate={75.0}
              isPOTM={false}
              isAdmin={false}
            />
          </div>

          {/* Form Upload Input */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 rounded-2xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-[#FF7A45]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {selectedFile ? selectedFile.name : 'Pilih File Foto Baru'}
            </button>
          </div>

          {/* Pesan Error jika ada */}
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs text-center">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white/70 hover:text-white transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSavePhoto}
            disabled={!selectedFile || isUploading}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all ${
              !selectedFile || isUploading
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#B84013] to-[#FF5500] hover:brightness-110 active:scale-95'
            }`}
          >
            {isUploading ? 'Menyimpan...' : 'Simpan Foto'}
          </button>
        </div>
      </div>
    </div>
  );
};
