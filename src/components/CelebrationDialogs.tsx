import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ArrowRight, Gift, Sparkles } from 'lucide-react';
import { DialogFrame } from './DialogFrame';
import { appCopy } from '../data/config';

type GiftDialogProps = {
  giftNumber: number | null;
  onClose: () => void;
};

export function GiftDialog({ giftNumber, onClose }: GiftDialogProps) {
  const titleId = 'gift-dialog-title';
  return (
    <DialogFrame open={giftNumber !== null} labelledBy={titleId} onClose={onClose} className="gift-dialog">
      {giftNumber !== null && (
        <motion.section
          className="gift-content"
          initial={false}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2, type: 'spring', bounce: 0.2 }}
        >
          <div className="gift-big-icon"><Gift size={32} aria-hidden="true" /></div>
          <p className="eyebrow">Casilla abierta</p>
          <h2 id={titleId}>¡Te toca el regalo {giftNumber}!</h2>
          <p className="gift-description">Busca el paquete con el número <strong>{giftNumber}</strong>. ¡Hay algo especial esperándote!</p>
          <button className="button button-primary continue-button" type="button" onClick={onClose}>
            Volver al tablero <ArrowRight size={19} aria-hidden="true" />
          </button>
        </motion.section>
      )}
    </DialogFrame>
  );
}

type FinalDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function FinalDialog({ open, onClose }: FinalDialogProps) {
  const reduceMotion = Boolean(useReducedMotion());
  const titleId = 'final-dialog-title';

  useEffect(() => {
    if (!open || reduceMotion) return;
    void confetti({
      particleCount: 240,
      spread: 150,
      startVelocity: 48,
      gravity: 0.72,
      ticks: 230,
      origin: { y: 0.48 },
      colors: ['#fff0a8', '#ffd43b', '#f5a623', '#fff8dd'],
      disableForReducedMotion: true,
    });
  }, [open, reduceMotion]);

  return (
    <DialogFrame open={open} labelledBy={titleId} onClose={onClose} className="final-dialog">
      {open && (
        <motion.section
          className="final-content"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.88, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.42, type: 'spring', bounce: 0.3 }}
        >
          <div className="final-seal"><Sparkles size={24} aria-hidden="true" /><span>24</span><Sparkles size={24} aria-hidden="true" /></div>
          <p className="eyebrow">Siete Martas · un regalo final</p>
          <h2 id={titleId}>{appCopy.finalTitle}</h2>
          <p>{appCopy.finalMessage}</p>
          <p className="final-submessage">La sorpresa final ya es tuya. ¡Que empiece la celebración!</p>
          <button className="button button-gold continue-button" type="button" onClick={onClose}>
            ¡A celebrar! <Sparkles size={18} aria-hidden="true" />
          </button>
          <span className="final-floating-icon final-floating-one" aria-hidden="true">✨</span>
          <span className="final-floating-icon final-floating-two" aria-hidden="true">🎉</span>
        </motion.section>
      )}
    </DialogFrame>
  );
}
