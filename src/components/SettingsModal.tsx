import Modal from '@/components/Modal';
import UsersPanel from '@/components/UsersPanel';

interface SettingsModalProps {
  currentUserId: string;
  onClose: () => void;
}

export default function SettingsModal({ currentUserId, onClose }: SettingsModalProps) {
  return (
    <Modal title="Pengaturan Master" onClose={onClose}>
      <UsersPanel currentUserId={currentUserId} />
    </Modal>
  );
}
