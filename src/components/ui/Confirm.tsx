import { Button } from './Button';
import { Modal }  from './Modal';

interface ConfirmProps {
  open:      boolean;
  onClose:   () => void;
  onConfirm: () => void;
  title:     string;
  message:   string;
  loading?:  boolean;
}

export function Confirm({ open, onClose, onConfirm, title, message, loading }: ConfirmProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p style={{ fontSize: '.875rem', color: 'var(--fg-muted)', marginBottom: 20 }}>
        {message}
      </p>
      <div className="btn-group-end">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>Confirmar</Button>
      </div>
    </Modal>
  );
}
