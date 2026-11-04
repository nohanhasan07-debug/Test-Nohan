import { useState } from 'react';
import Modal from '@/components/Modal';
import PlayersPanel from '@/components/PlayersPanel';
import UsersPanel from '@/components/UsersPanel';
import type { Player } from '@/types';

type SettingsTab = 'users' | 'players';

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'users', label: 'Pengguna' },
  { id: 'players', label: 'Pemain' },
];

interface SettingsModalProps {
  currentUserId: string;
  players: Player[];
  onAddPlayer: (name: string) => Promise<void>;
  onLinkPlayer: (playerId: string, profileId: string | null) => Promise<void>;
  onDeletePlayer: (playerId: string) => Promise<void>;
  onClose: () => void;
}

export default function SettingsModal({
  currentUserId,
  players,
  onAddPlayer,
  onLinkPlayer,
  onDeletePlayer,
  onClose,
}: SettingsModalProps) {
  const [tab, setTab] = useState<SettingsTab>('users');

  return (
    <Modal title="Pengaturan Master" onClose={onClose}>
      <div className="flex flex-col gap-6">
        <div role="tablist" className="grid grid-cols-2 gap-1 rounded-full border-2 border-white/20 bg-white/5 p-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                tab === id ? 'bg-paper text-ink-950 shadow' : 'text-paper/80 hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'users' && <UsersPanel currentUserId={currentUserId} />}
        {tab === 'players' && (
          <PlayersPanel
            players={players}
            onAddPlayer={onAddPlayer}
            onLinkPlayer={onLinkPlayer}
            onDeletePlayer={onDeletePlayer}
          />
        )}
      </div>
    </Modal>
  );
}
