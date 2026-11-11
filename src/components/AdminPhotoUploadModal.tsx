import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Player } from '../types/playerCard';
import { PlayerCard } from './PlayerCard';

interface AdminPhotoUploadModalProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedPlayer: Player) => void;
}

const STORAGE_KEY = 'patc_user_session';

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (!file.type.startsWith('image/')) {
        setErrorMessage('File harus berupa gambar (JPG, PNG, atau WEBP).');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Ukuran file maksimal 5MB.');
        return;
      }

      setErrorMessage(null);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSavePhoto = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setErrorMessage(null);

      const fileExt = selectedFile.name.split('.').pop() || 'jpg';
      const fileName = `${player.id}-${Date.now()}.${fileExt}`;
      const filePath = `portraits/${fileName}`;

      // 1. Upload ke Storage Supabase di bucket 'player-photos'
      const { error: uploadError } = await supabase.storage
        .from('player-photos')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 2. Ambil Public URL foto
      const { data: publicUrlData } = supabase.storage
        .from('player-photos')
        .getPublicUrl(filePath);

      const newPhotoUrl = publicUrlData.publicUrl;

      // 3. Update foto di tabel profiles
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ photo_url: newPhotoUrl })
        .eq('id', player.id);

      if (dbError) throw dbError;

      // 4. Update juga di tabel club_players jika ada
      try {
        await supabase
          .from('club_players')
          .update({ photo_url: newPhotoUrl })
          .eq('profile_id', player.id);
      } catch {
        // Abaikan jika tidak ada
      }

      // 5. Update session lokal jika user sedang mengubah fotonya sendiri
      try {
        const savedSession = localStorage.getItem(STORAGE_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed.id === player.id) {
            parsed.photo_url = newPhotoUrl;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          }
        }
      } catch {
        // Abaikan error session
      }

      // 6. Callback berhasil
      onSuccess({
        ...player,
        photo_url: newPhotoUrl,
      });

      onClose();
    } catch (err: any) {
      console.error('Upload error:', err);
      setErrorMessage(err.message || 'Gagal mengunggah foto. Pastikan bucket Storage diset Public.');
    } finally {
      setIsUploading(false);
    }
  };

  const previewPlayer: Player = {
    ...player,
    photo_url: previewUrl,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0F0402] border border-[#FF7A45]/40 rounded-3xl p-6 shadow-2xl overflow-hidden">
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-[#FF5500]/20 rounded-full blur-[90px] pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 style={{ color: '#FFFFFF' }} className="text-lg font-bold tracking-wide flex items-center gap-2">
              <span className="text-[#FF7A45]">⚡</span> UBAH FOTO PROFIL
            </h3>
            <p style={{ color: '#FF7A45' }} className="text-xs font-semibold">
              Foto ini otomatis menjadi potret resmi Player Card @{player.name}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            style={{ color: '#FFFFFF' }}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="mt-5 space-y-4">
          <div style={{ color: '#FF7A45' }} className="text-[11px] font-bold uppercase tracking-wider">
            PREVIEW TAMPILAN KARTU
          </div>

          <div className="max-w-[220px] mx-auto">
            <PlayerCard
              player={previewPlayer}
              matchesCount={10}
              winRate={75.0}
              isPOTM={false}
              isAdmin={false}
            />
          </div>

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
              className="w-full py-3 px-4 rounded-2xl border border-dashed border-[#FF7A45]/40 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-[#FF7A45]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {selectedFile ? selectedFile.name : 'Pilih File Foto Baru (JPG / PNG / WEBP)'}
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs text-center font-medium">
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
            style={{ color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.2)' }}
            className="border px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSavePhoto}
            disabled={!selectedFile || isUploading}
            style={
              !selectedFile || isUploading
                ? { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.4)' }
                : { background: 'linear-gradient(to right, #B84013, #FF7A45)', color: '#FFFFFF' }
            }
            className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Mengunggah...' : 'Simpan Foto'}
          </button>
        </div>
      </div>
    </div>
  );
};
