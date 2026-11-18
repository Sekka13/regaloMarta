import { motion, useReducedMotion } from 'framer-motion';
import { Gift, Lock, Sparkles, Star } from 'lucide-react';
import { calendarOrder, martas } from '../data/config';
import type { MartaId, PersistedProgress } from '../types/game';

type CalendarBoardProps = {
  progress: PersistedProgress;
  revealMartaId: MartaId | null;
  onOpenGift: (number: number) => void;
  onLocked: (number: number) => void;
};

function ownerForGift(number: number) {
  return martas.find((marta) => marta.giftNumbers.includes(number));
}

export function CalendarBoard({ progress, revealMartaId, onOpenGift, onLocked }: CalendarBoardProps) {
  const reduceMotion = Boolean(useReducedMotion());
  const allMartasUnlocked = martas.every((marta) => progress.completedMartaIds.includes(marta.id));

  return (
    <section className="calendar-section" aria-labelledby="calendar-heading">
      <div className="section-heading-row calendar-title-row">
        <div>
          <p className="eyebrow">24 sorpresas te esperan</p>
          <h2 id="calendar-heading">El tablero de regalos</h2>
        </div>
        <div className="calendar-key" aria-label="Leyenda del tablero">
          <span><Lock size={12} aria-hidden="true" /> Cerrada</span>
          <span><Gift size={12} aria-hidden="true" /> Lista</span>
        </div>
      </div>

      <ol className="calendar-grid" aria-label="Casillas del Martalendario">
        {calendarOrder.map((number, index) => {
          const finalCell = number === 24;
          const owner = finalCell ? undefined : ownerForGift(number);
          const isUnlocked = finalCell
            ? allMartasUnlocked
            : Boolean(owner && progress.completedMartaIds.includes(owner.id));
          const hasOpened = finalCell ? progress.finalOpened : progress.openedGiftNumbers.includes(number);
          const isRevealing = Boolean(owner && owner.id === revealMartaId);
          const revealOrder = isRevealing && owner ? owner.giftNumbers.indexOf(number) : 0;
          const tileClass = `calendar-tile tile-tone-${(index % 4) + 1} ${finalCell ? 'tile-final' : ''} ${isUnlocked ? 'tile-unlocked' : 'tile-locked'} ${hasOpened ? 'tile-opened' : ''}`;
          const accessibleLabel = finalCell
            ? (isUnlocked ? 'Casilla 24, gran final, abrir premio' : 'Casilla 24, gran final bloqueado. Completa las siete Martas para abrirlo')
            : (isUnlocked ? `Regalo ${number}, listo para abrir` : `Casilla ${number}, cerrada. Selecciona para jugar al minijuego que la desbloquea`);

          return (
            <motion.li
              key={number}
              className="calendar-cell"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.88, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.24, delay: reduceMotion ? 0 : index * 0.012 }}
            >
              <motion.button
                type="button"
                className={tileClass}
                aria-label={accessibleLabel}
                onClick={() => isUnlocked ? onOpenGift(number) : onLocked(number)}
                animate={isRevealing && !reduceMotion
                  ? { scale: [0.7, 1.16, 0.94, 1], rotate: [-9, 5, -2, 0], y: [8, -6, 0] }
                  : { scale: 1, rotate: 0, y: 0 }}
                transition={{
                  duration: reduceMotion ? 0 : isRevealing ? 0.72 : 0.18,
                  delay: reduceMotion ? 0 : isRevealing ? revealOrder * 0.17 : 0,
                  type: 'spring',
                  bounce: 0.42,
                }}
                whileTap={reduceMotion || isUnlocked ? undefined : { x: [-3, 3, -2, 0], transition: { duration: 0.2 } }}
              >
                <span className="tile-topline">
                  <span className="tile-number">{String(number).padStart(2, '0')}</span>
                  {finalCell && <Star size={15} fill="currentColor" aria-hidden="true" />}
                </span>
                {finalCell ? (
                  <span className="tile-center tile-final-center">
                    {isUnlocked ? <Sparkles size={25} aria-hidden="true" /> : <span className="final-question">?</span>}
                    <span>{isUnlocked ? '¡Final!' : 'Gran final'}</span>
                  </span>
                ) : (
                  <span className="tile-center">
                    {isUnlocked ? <Gift size={23} aria-hidden="true" /> : <span className="tile-question">?</span>}
                    <span>{isUnlocked ? (hasOpened ? 'Abierto' : `Regalo ${number}`) : 'Sorpresa'}</span>
                  </span>
                )}
                {!isUnlocked && <Lock className="tile-lock" size={13} aria-hidden="true" />}
                {hasOpened && <span className="tile-open-stamp">✓</span>}
                {isRevealing && !reduceMotion && (
                  <motion.span
                    className="tile-unlock-sparkle"
                    aria-hidden="true"
                    initial={{ opacity: 0, scale: 0.3, rotate: -20 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.3, 1.25, 0.8], rotate: [0, 12, 32] }}
                    transition={{ duration: 0.76, delay: revealOrder * 0.17, ease: 'easeOut' }}
                  >
                    ✨
                  </motion.span>
                )}
              </motion.button>
            </motion.li>
          );
        })}
      </ol>
      <p className="calendar-footnote">Elige una casilla cerrada para empezar su minijuego. Al completarlo, se abren sus regalos. 🎁</p>
    </section>
  );
}
