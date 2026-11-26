import { motion, useReducedMotion } from 'framer-motion';
import { Gift, Lock } from 'lucide-react';
import { calendarLayout, martas, buildCalendarTiles } from '../data/config';
import type { MartaId, PersistedProgress } from '../types/game';

type CalendarBoardProps = {
  progress: PersistedProgress;
  revealMartaId: MartaId | null;
  onOpenGift: (number: number) => void;
  onLocked: (number: number) => void;
};

const ownerMap = new Map(
  martas.flatMap((m) =>
    m.giftNumbers.map((number) => [number, m] as const)
  )
);

export function CalendarBoard({ progress, revealMartaId, onOpenGift, onLocked }: CalendarBoardProps) {
  const reduceMotion = Boolean(useReducedMotion());
  const allMartasUnlocked = martas.every((marta) => progress.completedMartaIds.includes(marta.id));
  const tiles = buildCalendarTiles(calendarLayout);

  // Última Marta desbloqueada: mantiene el brillo de sus casillas hasta que se desbloquee otra posterior
  const latestUnlockedMartaId =
    progress.completedMartaIds.length > 0
      ? progress.completedMartaIds[progress.completedMartaIds.length - 1]
      : null;

  return (
    <section className="calendar-section" aria-labelledby="calendar-heading">
      <div className="section-heading-row calendar-title-row">
        <div>
          <p className="eyebrow">24 sorpresas te esperan</p>
          <h2 id="calendar-heading">El tablero de regalos</h2>
        </div>

      </div>

      <ol className="calendar-grid" aria-label="Casillas del Martalendario">
        {tiles.map((tile, index) => {
          const number = tile.number;
          const finalCell = number === 24;
          const owner = finalCell ? undefined : ownerMap.get(number);
          const isUnlocked = finalCell
            ? allMartasUnlocked
            : Boolean(owner && progress.completedMartaIds.includes(owner.id));
          const hasOpened = finalCell ? progress.finalOpened : progress.openedGiftNumbers.includes(number);

          // Animación puntual al desbloquear esta Marta
          const isRevealing = Boolean(owner && owner.id === revealMartaId);
          const revealOrder = isRevealing && owner ? Math.max(0, owner.giftNumbers.indexOf(number)) : 0;

          // Brillo persistente mientras sea la última Marta conseguida y la casilla siga desbloqueada
          const isActiveLatestGroup = finalCell
            ? allMartasUnlocked && progress.completedMartaIds.length === martas.length
            : Boolean(owner && owner.id === latestUnlockedMartaId);
          const hasSustainedGlow = Boolean(isUnlocked && isActiveLatestGroup && !hasOpened);

          const colorClass = finalCell
            ? 'marta-color-final'
            : owner
              ? `marta-color-${owner.color}`
              : '';

          const tileClass = [
            'calendar-tile',
            colorClass,
            finalCell ? 'tile-final' : '',
            isUnlocked ? 'tile-unlocked' : 'tile-locked',
            hasOpened ? 'tile-opened' : '',
            isRevealing ? 'is-revealing' : '',
            hasSustainedGlow ? 'is-glowing' : '',
          ]
            .filter(Boolean)
            .join(' ');

          const accessibleLabel = finalCell
            ? (isUnlocked
                ? 'Casilla 24, gran final, abrir premio'
                : 'Casilla 24, gran final bloqueado. Completa las siete Martas para abrirlo')
            : (isUnlocked
                ? `Casilla ${number}, lista para abrir`
                : `Casilla ${number}, cerrada. Selecciona para jugar al minijuego que la desbloquea`);

          return (
            <motion.li
              key={number}
              className="calendar-cell"
              style={{
                gridColumn: `${tile.col + 1} / span ${tile.colSpan}`,
                gridRow: `${tile.row + 1} / span ${tile.rowSpan}`,
              }}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                duration: reduceMotion ? 0 : 0.24,
                delay: reduceMotion ? 0 : index * 0.012,
              }}
            >
              <motion.button
                type="button"
                className={tileClass}
                aria-label={accessibleLabel}
                onClick={() => (isUnlocked ? onOpenGift(number) : onLocked(number))}
                animate={
                  isRevealing && !reduceMotion
                    ? {
                        scale: [0.84, 1.15, 0.96, 1.04, 1],
                        rotate: [-6, 4, -2, 1, 0],
                        y: [6, -7, 2, -2, 0],
                      }
                    : { scale: 1, rotate: 0, y: 0 }
                }
                transition={{
                  duration: reduceMotion ? 0 : isRevealing ? 0.78 : 0.18,
                  delay: reduceMotion ? 0 : isRevealing ? revealOrder * 0.16 : 0,
                  type: 'spring',
                  bounce: 0.38,
                }}
                whileTap={
                  reduceMotion || isUnlocked
                    ? undefined
                    : { x: [-3, 3, -2, 0], transition: { duration: 0.2 } }
                }
              >
                <span className="tile-door-sheen" aria-hidden="true" />
                <span className="tile-number">{number}</span>

                {isRevealing && !reduceMotion && (
                  <motion.span
                    className="tile-unlock-sparkle"
                    aria-hidden="true"
                    initial={{ opacity: 0, scale: 0.25, rotate: -25 }}
                    animate={{
                      opacity: [0, 1, 0.9, 0],
                      scale: [0.25, 1.35, 1.05, 0.7],
                      rotate: [-15, 14, 28, 45],
                    }}
                    transition={{
                      duration: 0.82,
                      delay: revealOrder * 0.16,
                      ease: 'easeOut',
                    }}
                  >
                    ✦
                  </motion.span>
                )}
              </motion.button>
            </motion.li>
          );
        })}
      </ol>
      <p className="calendar-footnote">
        Elige una casilla cerrada para empezar su minijuego. Al completarlo, se abren sus regalos. 🎁
      </p>
    </section>
  );
}
