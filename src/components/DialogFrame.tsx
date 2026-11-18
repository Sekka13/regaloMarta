import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

type DialogFrameProps = {
  open: boolean;
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

export function DialogFrame({ open, labelledBy, onClose, children, className = '' }: DialogFrameProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={`dialog-frame ${className}`}
      aria-labelledby={labelledBy}
      onClose={onClose}
    >
      <button className="dialog-close" type="button" aria-label="Cerrar ventana" onClick={() => dialogRef.current?.close()}>
        <X size={20} aria-hidden="true" />
      </button>
      {children}
    </dialog>
  );
}
